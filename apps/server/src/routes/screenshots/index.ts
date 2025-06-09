import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { CreateScreenshotSchema } from "@screenshothis/schemas/screenshots";
import { endTime, setMetric, startTime } from "hono/timing";
import { objectToCamel } from "ts-case-convert";

import type { Variables } from "#/common/environment";
import { auth } from "#/lib/auth";
import { logger } from "#/lib/logger";
import {
	RequestQuotaError,
	assertQuotaAvailable,
	consumeQuota,
} from "#/lib/request-quota";
import { s3 } from "#/lib/s3";
import {
	enqueueScreenshotJob,
	getExistingScreenshotKey,
} from "#/lib/screenshot-queue";
import { deduplicateRequest, generateCacheKey } from "#/utils/deduplication";
import { createErrorResponse } from "#/utils/errors";

const PLACEHOLDER_IMAGE = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5K7f0AAAAASUVORK5CYII=",
	"base64",
);

function generateETag(
	cacheKey: string,
	format: string,
	timestamp: number,
	additionalEntropy?: {
		s3Key?: string;
		s3ETag?: string;
		fileSize?: number;
	},
): string {
	// Always ensure we have a valid timestamp
	const safeTimestamp = timestamp || Date.now();

	// Build content with multiple entropy sources
	const baseContent = `${cacheKey}-${format}-${safeTimestamp}`;

	// Add additional entropy if available
	const entropyParts = [baseContent];
	if (additionalEntropy?.s3Key) {
		entropyParts.push(`key:${additionalEntropy.s3Key}`);
	}
	if (additionalEntropy?.s3ETag) {
		entropyParts.push(`etag:${additionalEntropy.s3ETag}`);
	}
	if (additionalEntropy?.fileSize) {
		entropyParts.push(`size:${additionalEntropy.fileSize}`);
	}

	// Add process-level entropy as final safeguard
	entropyParts.push(
		`proc:${process.pid}-${Math.random().toString(36).slice(2)}`,
	);

	const content = entropyParts.join("|");
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(content);
	return `"${hasher.digest("hex").slice(0, 16)}"`;
}

function setCDNCacheHeaders(
	headers: Headers,
	scenario: "success" | "placeholder" | "error",
	params: {
		cacheTtl?: number;
		format: string;
		cacheKey: string;
		isNewContent?: boolean;
		workspaceId: string;
		timestamp?: number;
		additionalEntropy?: {
			s3Key?: string;
			s3ETag?: string;
			fileSize?: number;
		};
	},
) {
	const {
		cacheTtl = 3600,
		format,
		cacheKey,
		isNewContent,
		workspaceId,
		timestamp,
		additionalEntropy,
	} = params;

	switch (scenario) {
		case "success": {
			const browserTtl = isNewContent ? Math.min(cacheTtl, 300) : cacheTtl;
			headers.set(
				"Cache-Control",
				`public, max-age=${browserTtl}, stale-while-revalidate=${Math.floor(cacheTtl * 0.1)}`,
			);

			headers.set(
				"CDN-Cache-Control",
				`public, max-age=${cacheTtl * 2}, stale-while-revalidate=${cacheTtl}, stale-if-error=${cacheTtl * 24}`,
			);

			headers.set(
				"CF-Cache-Tag",
				`workspace:${workspaceId},format:${format},content:screenshot`,
			);
			headers.set("CF-Edge-Cache", "cache,platform=cf");

			headers.set(
				"ETag",
				generateETag(
					cacheKey,
					format,
					timestamp || Date.now(),
					additionalEntropy,
				),
			);

			break;
		}

		case "placeholder":
			headers.set("Cache-Control", "public, max-age=30, must-revalidate");
			headers.set(
				"CDN-Cache-Control",
				"public, max-age=60, stale-while-revalidate=30",
			);
			headers.set(
				"CF-Cache-Tag",
				`workspace:${workspaceId},content:placeholder`,
			);
			break;

		case "error":
			headers.set("Cache-Control", "public, max-age=10, must-revalidate");
			headers.set(
				"CDN-Cache-Control",
				"public, max-age=30, stale-if-error=300",
			);
			headers.set("CF-Cache-Tag", `workspace:${workspaceId},content:error`);
			break;
	}

	headers.set("Vary", "Accept, Accept-Encoding, User-Agent");
	headers.set("X-Content-Type-Options", "nosniff");

	headers.set("X-Edge-Location", "auto");
	headers.set("X-Cache-Regions", "global");

	if (format === "png" || format === "webp") {
		headers.set("X-Compress-Hint", "aggressive");
	}
}

const optimizedScreenshots = new OpenAPIHono<{
	Variables: Variables;
}>().openapi(
	createRoute({
		method: "get",
		path: "/take",
		request: {
			query: CreateScreenshotSchema.transform((data) => objectToCamel(data)),
		},
		responses: {
			200: {
				content: {
					"image/jpeg": {
						schema: z.string(),
						encoding: {
							contentType: "image/jpeg",
						},
					},
					"image/png": {
						schema: z.string(),
						encoding: {
							contentType: "image/png",
						},
					},
					"image/webp": {
						schema: z.string(),
						encoding: {
							contentType: "image/webp",
						},
					},
				},
				description: "Optimized screenshot response with enhanced CDN support",
			},
			304: {
				description: "Not Modified - Content hasn't changed",
			},
		},
	}),
	async (c) => {
		startTime(c, "total-request");

		try {
			startTime(c, "auth-check");
			const { valid, key } = await auth.api.verifyApiKey({
				body: {
					key: c.req.valid("query").apiKey,
				},
			});
			endTime(c, "auth-check");

			if (!valid || !key || !key.metadata?.workspaceId) {
				setMetric(c, "auth-failed", 1);
				return c.json({ error: "Unauthorized" }, 401);
			}

			const queryParams = c.req.valid("query");
			const workspaceId = key.metadata.workspaceId;
			const userId = key.userId;

			const transformedParams = {
				...queryParams,
				url: new URL(queryParams.url).toString(),
				selector: queryParams.selector?.trim() || undefined,
			};

			const cacheKey = generateCacheKey(workspaceId, transformedParams);
			setMetric(c, "cache-key-generated", 1);

			startTime(c, "quota-check");
			try {
				await assertQuotaAvailable(userId);
			} catch (error) {
				endTime(c, "quota-check");
				if (error instanceof RequestQuotaError) {
					setMetric(c, "quota-exceeded", 1);
					return c.json(
						{
							error:
								error.type === "EXCEEDED"
									? "You have reached the maximum number of requests allowed for your current plan."
									: "Request limits not found for the current user",
						},
						403,
					);
				}
				throw error;
			}
			endTime(c, "quota-check");

			const result = await deduplicateRequest(
				cacheKey,
				async () => {
					startTime(c, "existing-check");
					const existingKey = await getExistingScreenshotKey(
						workspaceId,
						transformedParams,
					);
					endTime(c, "existing-check");

					if (existingKey) {
						setMetric(c, "screenshot-found-existing", 1);
						return {
							key: existingKey,
							created: false,
						};
					}

					startTime(c, "job-enqueue");
					const jobResult = await enqueueScreenshotJob(
						workspaceId,
						userId,
						transformedParams,
					);
					endTime(c, "job-enqueue");

					setMetric(c, "screenshot-job-enqueued", 1);
					logger.info(
						{
							workspaceId,
							url: transformedParams.url,
							cacheKey,
						},
						"Screenshot job enqueued successfully",
					);

					return {
						key: jobResult.key || null,
						created: jobResult.created,
					};
				},
				c,
			);

			const headers = new Headers();
			let body: ArrayBuffer | Buffer | ReadableStream;
			let contentType: string;
			let cacheScenario: "success" | "placeholder" | "error";
			let screenshotTimestamp: number;
			let s3Metadata: { etag?: string; size?: number } | undefined;

			if (result.data.key) {
				startTime(c, "s3-fetch");
				try {
					const s3File = s3.file(result.data.key);

					if (result.data.created) {
						screenshotTimestamp = Date.now();
					} else {
						const fileStat = await s3File.stat();
						screenshotTimestamp = fileStat.lastModified.getTime();
						s3Metadata = {
							etag: fileStat.etag,
							size: fileStat.size,
						};
					}

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
						return c.body(null, 304, {
							ETag: expectedETag,
							"Cache-Control": "public, max-age=3600",
						});
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
					headers.set("Retry-After", "5");
					setMetric(c, "screenshot-s3-error", 1);
				}
			} else {
				body = PLACEHOLDER_IMAGE;
				contentType = "image/png";
				cacheScenario = "placeholder";
				screenshotTimestamp = Date.now();
				headers.set("Retry-After", "10");
				setMetric(c, "placeholder-served", 1);
			}

			setCDNCacheHeaders(headers, cacheScenario, {
				cacheTtl: queryParams.cacheTtl,
				format: queryParams.format,
				cacheKey,
				isNewContent: result.data.created,
				workspaceId,
				timestamp: screenshotTimestamp,
				additionalEntropy: result.data.key
					? {
							s3Key: result.data.key,
							s3ETag: s3Metadata?.etag,
							fileSize: s3Metadata?.size,
						}
					: undefined,
			});

			if (result.data.created && !result.wasDeduplicated) {
				startTime(c, "quota-consume");
				try {
					const quota = await consumeQuota(userId, {
						workspaceId,
						url: queryParams.url,
						format: queryParams.format,
						userAgent: queryParams.userAgent,
						source: "rest-optimized",
					});
					headers.set("X-Remaining-Requests", String(quota.remaining));
					if (quota.nextRefillAt) {
						headers.set("X-Refill-At", String(quota.nextRefillAt.getTime()));
					}
				} catch (error) {
					logger.error({ err: error }, "Failed to consume quota");
				}
				endTime(c, "quota-consume");
			}

			if (body instanceof ReadableStream) {
				// Don't set Content-Length for streaming responses - browser will handle chunked encoding
			} else {
				headers.set("Content-Length", String(body.byteLength));
			}
			headers.set("Content-Type", contentType);
			headers.set("Accept-Ranges", "bytes");
			headers.set(
				"Content-Disposition",
				`inline; filename="screenshot.${queryParams.format}"`,
			);

			headers.set("X-Deduplicated", result.wasDeduplicated ? "true" : "false");
			headers.set("X-Cache-Key", cacheKey);
			headers.set("X-Content-Fresh", result.data.created ? "true" : "false");
			headers.set("X-Cache-Scenario", cacheScenario);

			headers.set("X-Robots-Tag", "noindex, nofollow");
			headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

			endTime(c, "total-request");
			return c.body(body, { headers });
		} catch (error) {
			endTime(c, "total-request");
			setMetric(c, "request-error", 1);

			const errorResponse = createErrorResponse(error, c.get("requestId"));
			return c.json(errorResponse, 500);
		}
	},
);

export default optimizedScreenshots;
