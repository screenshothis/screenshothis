import type { Context } from "hono";
import { endTime, setMetric, startTime } from "hono/timing";

import { logger } from "../lib/logger";
import { s3 } from "../lib/s3";
import type { ScreenshotJobParams } from "../lib/screenshot-queue";
import {
	enqueueScreenshotJob,
	getExistingScreenshotKey,
} from "../lib/screenshot-queue";
import { deduplicateRequest } from "../utils/deduplication";
import { generateETag } from "../utils/etag";

type ScreenshotParams = ScreenshotJobParams["params"];

const PLACEHOLDER_IMAGE = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5K7f0AAAAASUVORK5CYII=",
	"base64",
);

export async function retrieveScreenshot(
	c: Context,
	cacheKey: string,
	workspaceId: string,
	userId: string,
	transformedParams: ScreenshotParams,
	queryParams: ScreenshotParams,
) {
	const result = await deduplicateRequest(
		cacheKey,
		async () => {
			// Check DB for existing screenshot
			startTime(c, "existing-check");
			const existingKey = await getExistingScreenshotKey(
				workspaceId,
				transformedParams,
			);
			endTime(c, "existing-check");

			if (existingKey) {
				setMetric(c, "screenshot-found-existing", 1);
				return { key: existingKey, created: false };
			}

			// Enqueue job
			startTime(c, "job-enqueue");
			const jobResult = await enqueueScreenshotJob(
				workspaceId,
				userId,
				transformedParams,
			);
			endTime(c, "job-enqueue");

			setMetric(c, "screenshot-job-enqueued", 1);
			logger.info(
				{ workspaceId, url: transformedParams.url, cacheKey },
				"Screenshot job enqueued successfully",
			);

			return { key: jobResult.key || null, created: jobResult.created };
		},
		c,
	);

	let body: ArrayBuffer | Buffer | ReadableStream;
	let contentType: string;
	let cacheScenario: "success" | "placeholder" | "error";
	let screenshotTimestamp: number;
	let s3Metadata: { etag?: string; size?: number } | undefined;
	let retryAfter: string | undefined;

	if (result.data.key) {
		// Fetch from S3
		startTime(c, "s3-fetch");
		try {
			const s3File = s3.file(result.data.key);

			if (result.data.created) {
				screenshotTimestamp = Date.now();
			} else {
				const fileStat = await s3File.stat();
				screenshotTimestamp = fileStat.lastModified.getTime();
				s3Metadata = { etag: fileStat.etag, size: fileStat.size };
			}

			// 304 handling
			const clientETag = c.req.header("If-None-Match");
			const expectedETag = generateETag(
				cacheKey,
				queryParams.format,
				screenshotTimestamp,
				{
					s3Key: result.data.key,
					s3ETag: s3Metadata?.etag,
					fileSize: s3Metadata?.size,
				},
			);

			if (clientETag === expectedETag) {
				endTime(c, "s3-fetch");
				setMetric(c, "cache-hit-etag", 1);
				return {
					body: null as unknown as Buffer, // Placeholder, will return response directly
					contentType: "",
					cacheScenario: "success",
					screenshotTimestamp,
					result,
					retryAfter: undefined,
					validatedETag: expectedETag,
				};
			}

			const s3Stream = s3File.stream();
			endTime(c, "s3-fetch");
			body = s3Stream;
			contentType = `image/${queryParams.format}`;
			cacheScenario = "success";
			setMetric(c, "screenshot-served", 1);
		} catch (error) {
			endTime(c, "s3-fetch");
			logger.error(
				{ err: error, key: result.data.key },
				"Failed to fetch screenshot from S3",
			);
			body = PLACEHOLDER_IMAGE;
			contentType = "image/png";
			cacheScenario = "error";
			screenshotTimestamp = Date.now();
			retryAfter = "5";
			setMetric(c, "screenshot-s3-error", 1);
		}
	} else {
		body = PLACEHOLDER_IMAGE;
		contentType = "image/png";
		cacheScenario = "placeholder";
		screenshotTimestamp = Date.now();
		retryAfter = "10";
		setMetric(c, "placeholder-served", 1);
	}

	return {
		body,
		contentType,
		cacheScenario,
		screenshotTimestamp,
		s3Metadata,
		result,
		retryAfter,
		validatedETag: undefined,
	};
}
