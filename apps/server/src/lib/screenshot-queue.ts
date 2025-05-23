import {
	type ConnectionOptions,
	type Job,
	Queue,
	QueueEvents,
	Worker,
} from "bullmq";
import { and, eq, sql } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { screenshots } from "#/db/schema/screenshots";
import { env } from "#/utils/env";
import { getOrCreateScreenshot } from "#/utils/screenshot";

const connection: ConnectionOptions = {
	url: env.REDIS_URL,
	retryStrategy: (times: number) => {
		const delay = Math.min(2 ** times * 1000, 10000);
		console.log(`Redis connection retry attempt ${times} in ${delay}ms`);
		return delay;
	},
};

const QUEUE_NAME = "screenshot-generation";

const screenshotQueue = new Queue(QUEUE_NAME, { connection });
// QueueScheduler is only necessary for delayed or recurring jobs. If needed in future,
// it can be instantiated here.
const queueEvents = new QueueEvents(QUEUE_NAME, { connection });

export interface ScreenshotJobParams {
	workspaceId: string;
	userId: string;
	params: Parameters<typeof getOrCreateScreenshot>[1];
}

type WorkerJobData = ScreenshotJobParams;

const screenshotWorker = new Worker<WorkerJobData>(
	QUEUE_NAME,
	async (
		job: Job<WorkerJobData>,
	): Promise<{ key: string; created: boolean }> => {
		try {
			const { workspaceId, userId, params } = job.data;

			const { key: objectKey, created } = await getOrCreateScreenshot(
				workspaceId,
				params,
			);

			if (created) {
				await db
					.update(schema.requestLimits)
					.set({
						totalRequests: sql`${schema.requestLimits.totalRequests} + 1`,
						remainingRequests: sql`${schema.requestLimits.remainingRequests} - 1`,
					})
					.where(eq(schema.requestLimits.userId, userId));
			}

			return { key: objectKey as string, created };
		} catch (error) {
			console.error("Error in screenshot worker:", error);

			throw error;
		}
	},
	{
		connection,
		concurrency: 10,
	},
);

screenshotWorker.on("error", (err: Error) => {
	console.error("Screenshot worker error", err);
});

function buildJobKey(
	workspaceId: string,
	params: ScreenshotJobParams["params"],
): string {
	// Sort keys to ensure consistent string representation
	const sortedParams = JSON.stringify(params, Object.keys(params).sort());
	const raw = workspaceId + sortedParams;
	// Bun.hash returns a 64-bit bigint which we convert to hex string
	return Bun.hash(raw).toString(16);
}

export async function enqueueScreenshotJob(
	workspaceId: string,
	userId: string,
	params: ScreenshotJobParams["params"],
): Promise<{ key: string; created: boolean }> {
	const jobId = buildJobKey(workspaceId, params);

	let job: Job | null = await screenshotQueue.getJob(jobId);

	if (!job) {
		// No job exists, create a new one
		job = await screenshotQueue.add(
			"generate",
			{ workspaceId, userId, params },
			{
				jobId,
				removeOnComplete: 1000,
				removeOnFail: {
					count: 1000,
					age: 24 * 3600, // 24 hours
				},
			},
		);
	} else {
		// Job exists, check its state
		const state = await job.getState();
		if (state === "completed") {
			// The result should already be in S3/DB, so return a marker to fetch it
			const returnvalue = job.returnvalue as
				| { key: string; created: boolean }
				| undefined;
			if (returnvalue?.key) {
				return { key: returnvalue.key, created: false };
			}
			// If no returnvalue, just return a marker to fetch from S3
			return { key: "", created: false };
		}
		if (
			state === "failed" ||
			state === "delayed" ||
			state === "waiting-children"
		) {
			// Remove the job and create a new one
			await job.remove();
			job = await screenshotQueue.add(
				"generate",
				{ workspaceId, userId, params },
				{
					jobId,
					removeOnComplete: 1000,
					removeOnFail: {
						count: 1000,
						age: 24 * 3600, // 24 hours
					},
				},
			);
		}
	}

	// Only call waitUntilFinished if job is not yet completed/failed/removed
	const result = (await job.waitUntilFinished(queueEvents)) as {
		key: string;
		created: boolean;
	};
	return result;
}

export const worker = screenshotWorker;

export async function shutdownWorker() {
	console.log("Closing screenshot worker...");
	await screenshotWorker.close();
	await screenshotQueue.close();
	console.log("Screenshot worker closed");
}

export async function getExistingScreenshotKey(
	workspaceId: string,
	params: ScreenshotJobParams["params"],
): Promise<string | null> {
	const {
		url,
		selector,
		width,
		height,
		isMobile,
		isLandscape,
		hasTouch,
		deviceScaleFactor,
		format,
		blockAds,
		blockCookieBanners,
		blockTrackers,
		blockRequests,
		blockResources,
		prefersColorScheme,
		prefersReducedMotion,
		isCached,
		cacheTtl,
		cacheKey,
	} = params;

	try {
		const existing = await db.query.screenshots.findFirst({
			where: and(
				eq(screenshots.url, url),
				selector ? eq(screenshots.selector, selector) : undefined,
				eq(screenshots.width, width),
				eq(screenshots.height, height),
				eq(screenshots.isMobile, isMobile),
				eq(screenshots.isLandscape, isLandscape),
				eq(screenshots.hasTouch, hasTouch),
				eq(screenshots.deviceScaleFactor, deviceScaleFactor),
				eq(screenshots.format, format),
				eq(screenshots.blockAds, blockAds),
				eq(screenshots.blockCookieBanners, blockCookieBanners),
				eq(screenshots.blockTrackers, blockTrackers),
				sql`${screenshots.blockRequests} @> ${JSON.stringify(blockRequests || [])}`,
				sql`${screenshots.blockResources} @> ${JSON.stringify(blockResources || [])}`,
				eq(screenshots.prefersColorScheme, prefersColorScheme),
				eq(screenshots.prefersReducedMotion, prefersReducedMotion),
				eq(screenshots.workspaceId, workspaceId),
				eq(screenshots.isCached, isCached),
				cacheTtl ? eq(screenshots.cacheTtl, cacheTtl) : undefined,
				cacheKey ? eq(screenshots.cacheKey, cacheKey) : undefined,
			),
		});

		if (!existing) return null;

		return `screenshots/${workspaceId}/${existing.id}.${format}`;
	} catch (error) {
		console.error("Error querying existing screenshot:", error);

		return null;
	}
}
