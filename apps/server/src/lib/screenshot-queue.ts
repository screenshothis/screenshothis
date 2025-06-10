import {
	type ConnectionOptions,
	type Job,
	Queue,
	QueueEvents,
	Worker,
} from "bullmq";
import { and, eq, sql } from "drizzle-orm";

import { db } from "../db";
import { requestLimits } from "../db/schema/request-limits";
import { screenshots } from "../db/schema/screenshots";
import { logger } from "../lib/logger";
import { env } from "../utils/env";
import { getOrCreateScreenshot } from "../utils/screenshot";
import { consumeQuota } from "./request-quota";

async function getUserPlan(userId: string): Promise<string> {
	try {
		const userLimits = await db.query.requestLimits.findFirst({
			where: eq(requestLimits.userId, userId),
			columns: { plan: true },
		});
		return userLimits?.plan || "free";
	} catch (error) {
		logger.error(
			{ err: error, userId },
			"Failed to get user plan, defaulting to free",
		);
		return "free";
	}
}

function getPriorityForPlan(plan: string): number {
	const priorityMap: Record<string, number> = {
		enterprise: 50,
		pro: 25,
		lite: 10,
		free: 1,
	};

	return priorityMap[plan] || 1;
}

const connection: ConnectionOptions = {
	url: env.REDIS_URL,
	retryStrategy: (times: number) => {
		const delay = Math.min(2 ** times * 1000, 10000);
		logger.warn({ attempt: times, delay }, "redis connection retry");
		return delay;
	},
	maxRetriesPerRequest: null,
};

// Using a hashtag ensures all BullMQ keys share the same hash slot so Dragonfly
// can allow the script to access dynamic job keys without the allow-undeclared-keys flag.
const QUEUE_NAME = "{screenshot-generation}";

const screenshotQueue = new Queue(QUEUE_NAME, {
	connection,
	defaultJobOptions: {
		removeOnComplete: 100, // Keep last 100 completed jobs for monitoring
		removeOnFail: 50, // Keep last 50 failed jobs for debugging
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 2000,
		},
	},
});

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
		const startTime = Date.now();

		try {
			const { workspaceId, userId, params } = job.data;

			// Update job progress
			await job.updateProgress(10);

			const { key: objectKey, created } = await getOrCreateScreenshot(
				workspaceId,
				params,
			);

			await job.updateProgress(80);

			if (created) {
				await consumeQuota(userId, {
					workspaceId,
					source: "worker",
				});
			}

			await job.updateProgress(100);

			const duration = Date.now() - startTime;
			logger.info(
				{
					jobId: job.id,
					workspaceId,
					url: params.url,
					duration,
					created,
				},
				"Screenshot job completed successfully",
			);

			return { key: objectKey as string, created };
		} catch (error) {
			const duration = Date.now() - startTime;
			logger.error(
				{
					jobId: job.id,
					err: error,
					duration,
					attempt: job.attemptsMade,
					maxAttempts: job.opts.attempts,
				},
				"error in screenshot worker",
			);

			throw error;
		}
	},
	{
		connection,
		concurrency: 10,
		// Add rate limiting to prevent overwhelming the system
		limiter: {
			max: 50, // Max 50 jobs per duration
			duration: 60000, // 1 minute
		},
	},
);

// Enhanced error handling
screenshotWorker.on("error", (err: Error) => {
	logger.error({ err }, "screenshot worker error");
});

screenshotWorker.on("failed", (job: Job | undefined, err: Error) => {
	logger.error(
		{
			jobId: job?.id,
			err,
			attempts: job?.attemptsMade,
			data: job?.data,
		},
		"screenshot job failed",
	);
});

screenshotWorker.on("completed", (job: Job) => {
	logger.info(
		{
			jobId: job.id,
			returnValue: job.returnvalue,
			processedOn: job.processedOn,
			finishedOn: job.finishedOn,
		},
		"screenshot job completed",
	);
});

screenshotWorker.on(
	"progress",
	(job: Job, progress: number | object | string | boolean) => {
		logger.debug(
			{
				jobId: job.id,
				progress,
			},
			"screenshot job progress updated",
		);
	},
);

// Queue error handling
screenshotQueue.on("error", (err) => {
	logger.error({ err }, "screenshot queue error");
});

// Global queue events for monitoring
queueEvents.on("completed", ({ jobId, returnvalue }) => {
	logger.debug({ jobId, returnvalue }, "job completed event");
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
	logger.warn({ jobId, failedReason }, "job failed event");
});

queueEvents.on("progress", ({ jobId, data }) => {
	logger.debug({ jobId, progress: data }, "job progress event");
});

// Utility to normalize string arrays (trim, lowercase, sort) for consistent hashing/comparison
function normalizeStringArray(arr: string[] | undefined | null): string[] {
	if (!arr) return [];
	return arr
		.map((s) => s.trim().toLowerCase())
		.filter((s) => s.length > 0)
		.sort();
}

// Normalize headers objects to string array for consistent hashing
function normalizeHeaders(
	headers: { name: string; value: string }[] | undefined,
): string[] {
	if (!headers) return [];
	return headers
		.map((h) => `${h.name.trim().toLowerCase()}: ${h.value.trim()}`)
		.filter((s) => s.length > 0)
		.sort();
}

// Normalize cookies objects to string array for consistent hashing
function normalizeCookies(
	cookies:
		| { name: string; value: string; [key: string]: unknown }[]
		| undefined,
): string[] {
	if (!cookies) return [];
	return cookies
		.map((c) => `${c.name.trim().toLowerCase()}=${c.value.trim()}`)
		.filter((s) => s.length > 0)
		.sort();
}

function buildJobKey(
	workspaceId: string,
	params: ScreenshotJobParams["params"],
): string {
	// Normalize headers/cookies for deterministic key generation
	const normalized = {
		...params,
		headers: normalizeHeaders(params.headers),
		cookies: normalizeCookies(params.cookies),
	};

	// Sort keys to ensure consistent string representation
	const sortedParams = JSON.stringify(
		normalized,
		Object.keys(normalized).sort(),
	);
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

	// Get user plan to determine job priority
	const userPlan = await getUserPlan(userId);
	const jobPriority = getPriorityForPlan(userPlan);

	let job: Job | null = await screenshotQueue.getJob(jobId);

	if (!job) {
		// No job exists, create a new one
		job = await screenshotQueue.add(
			"generate",
			{ workspaceId, userId, params },
			{
				jobId,
				removeOnComplete: false,
				removeOnFail: {
					count: 1000,
					age: 24 * 3600, // 24 hours
				},
				// Priority based on user's actual plan
				priority: jobPriority,
			},
		);

		logger.info(
			{
				jobId: job.id,
				workspaceId,
				userId,
				url: params.url,
			},
			"New screenshot job created",
		);
	} else {
		// Job exists, check its state
		const state = await job.getState();
		logger.debug(
			{
				jobId: job.id,
				state,
				workspaceId,
			},
			"Existing job found",
		);

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
					removeOnComplete: false,
					removeOnFail: {
						count: 1000,
						age: 24 * 3600, // 24 hours
					},
					// Use the same priority as determined earlier
					priority: jobPriority,
				},
			);

			logger.info(
				{
					jobId: job.id,
					previousState: state,
					workspaceId,
				},
				"Recreated job after failure/delay",
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
	logger.info("closing screenshot worker");
	await screenshotWorker.close();
	await screenshotQueue.close();
	await queueEvents.close();
	logger.info("screenshot worker closed");
}

// Queue health monitoring
export async function getQueueHealth() {
	try {
		const waiting = await screenshotQueue.getWaiting();
		const active = await screenshotQueue.getActive();
		const completed = await screenshotQueue.getCompleted();
		const failed = await screenshotQueue.getFailed();

		return {
			waiting: waiting.length,
			active: active.length,
			completed: completed.length,
			failed: failed.length,
			isPaused: await screenshotQueue.isPaused(),
			workerRunning: !screenshotWorker.closing,
		};
	} catch (error) {
		logger.error({ err: error }, "Failed to get queue health");
		return {
			waiting: -1,
			active: -1,
			completed: -1,
			failed: -1,
			isPaused: true,
			workerRunning: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
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
		userAgent,
		headers,
		cookies,
		bypassCsp,
	} = params;

	const normalizedHeaders = normalizeHeaders(headers);
	const normalizedCookies = normalizeCookies(cookies);

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
				userAgent ? eq(screenshots.userAgent, userAgent) : undefined,
				normalizedHeaders.length > 0
					? sql`${screenshots.headers} @> ${JSON.stringify(normalizedHeaders)}`
					: undefined,
				normalizedCookies.length > 0
					? sql`${screenshots.cookies} @> ${JSON.stringify(normalizedCookies)}`
					: undefined,
				eq(screenshots.bypassCsp, bypassCsp),
			),
		});

		if (!existing) return null;

		return `screenshots/${workspaceId}/${existing.id}.${format}`;
	} catch (error) {
		logger.error({ err: error }, "error querying existing screenshot");

		return null;
	}
}
