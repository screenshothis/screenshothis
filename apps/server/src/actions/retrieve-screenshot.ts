import type { Context } from "hono";
import { endTime, setMetric, startTime } from "hono/timing";

import { logger } from "../lib/logger";
import type { ScreenshotJobParams } from "../lib/screenshot-queue";
import {
	enqueueScreenshotJob,
	getExistingScreenshotKey,
} from "../lib/screenshot-queue";
import { storage } from "../lib/storage";
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
			const s3File = storage.file(result.data.key);

			if (result.data.created) {
				screenshotTimestamp = Date.now();
			} else {
				try {
					const fileStat = await s3File.stat();
					screenshotTimestamp = fileStat.lastModified.getTime();
					s3Metadata = { etag: fileStat.etag, size: fileStat.size };
				} catch (statError) {
					logger.warn(
						{ err: statError, key: result.data.key },
						"Failed to get file stats, will attempt direct stream",
					);
					// Use current time as fallback and continue with stream attempt
					screenshotTimestamp = Date.now();
				}
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
					body: null, // Placeholder, will return response directly
					contentType: "",
					cacheScenario: "success",
					screenshotTimestamp,
					result,
					retryAfter: undefined,
					etag: expectedETag,
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

			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			const isNotFound =
				errorMessage.includes("NoSuchKey") ||
				errorMessage.includes("404") ||
				errorMessage.includes("NotFound");

			let httpStatusCode: number | undefined;
			if (error && typeof error === "object" && "$response" in error) {
				const response = (error as { $response?: { statusCode?: number } })
					.$response;
				httpStatusCode = response?.statusCode;
			}

			logger.error(
				{
					err: error,
					key: result.data.key,
					errorType: isNotFound ? "FILE_NOT_FOUND" : "S3_ERROR",
					httpStatusCode,
				},
				isNotFound
					? "Screenshot file not found in S3 - possible upload failure"
					: "Failed to fetch screenshot from S3",
			);

			body = PLACEHOLDER_IMAGE;
			contentType = "image/png";
			cacheScenario = "error";
			screenshotTimestamp = Date.now();
			retryAfter = isNotFound ? "30" : "5"; // Longer retry for missing files
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
		etag: generateETag(
			cacheKey,
			queryParams.format,
			screenshotTimestamp,
			result.data.key && s3Metadata
				? {
						s3Key: result.data.key,
						s3ETag: s3Metadata.etag,
						fileSize: s3Metadata.size,
					}
				: undefined,
		),
	};
}
