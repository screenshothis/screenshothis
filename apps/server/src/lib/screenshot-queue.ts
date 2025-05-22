import {
	type ConnectionOptions,
	type Job,
	Queue,
	QueueEvents,
	Worker,
} from "bullmq";
import { eq, sql } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";
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

	const result = await Promise.race([
		job.waitUntilFinished(queueEvents) as Promise<{
			key: string;
			created: boolean;
		}>,
		new Promise<never>((_, reject) => {
			setTimeout(
				() => reject(new Error("Screenshot generation timed out")),
				30000,
			);
		}),
	]);

	return result;
}

export const worker = screenshotWorker;

export async function shutdownWorker() {
	console.log("Closing screenshot worker...");
	await screenshotWorker.close();
	await screenshotQueue.close();
	console.log("Screenshot worker closed");
}
