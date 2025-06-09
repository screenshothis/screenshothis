/**
 * Optimized Screenshot API Route
 *
 * This module provides an optimized screenshot service with advanced caching,
 * CDN integration, streaming responses, and robust ETag generation.
 *
 * Key features:
 * - S3 streaming to avoid memory overhead for large images
 * - Multi-layer caching (browser, CDN, conditional requests)
 * - Request deduplication to prevent duplicate screenshot generation
 * - Quota management and rate limiting
 * - ETags with multiple entropy sources for reliable cache invalidation
 * - Support for JPEG, PNG, and WebP formats
 *
 * @module OptimizedScreenshotRoute
 */

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

/**
 * A 1x1 transparent PNG image used as a placeholder when screenshots are not ready
 * or when errors occur. This prevents broken image displays in client applications.
 */
const PLACEHOLDER_IMAGE = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5K7f0AAAAASUVORK5CYII=",
	"base64",
);

/**
 * Generates a robust ETag for screenshot caching with multiple entropy sources.
 *
 * ETags are critical for HTTP caching and conditional requests. This implementation
 * uses multiple entropy sources to ensure:
 * 1. Same content produces same ETag (cache hits work)
 * 2. Different content produces different ETags (cache invalidation works)
 * 3. Virtually no collision risk (different files don't share ETags)
 *
 * Entropy sources (in order of importance):
 * - Cache key: Derived from URL, format, and other screenshot parameters
 * - Format: Image format (jpeg, png, webp)
 * - Timestamp: Screenshot creation/modification time
 * - S3 key: Unique file identifier in S3 storage
 * - S3 ETag: S3's own content-based hash
 * - File size: Additional content validation
 *
 * @param cacheKey - Unique identifier for the screenshot request parameters
 * @param format - Image format (jpeg, png, webp)
 * @param timestamp - Screenshot creation or last modified time
 * @param additionalEntropy - Optional S3 metadata for enhanced uniqueness
 * @returns RFC-compliant ETag header value (quoted hex string)
 */
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

	// Add additional entropy if available (S3 metadata provides strong uniqueness)
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

	const content = entropyParts.join("|");
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(content);
	return `"${hasher.digest("hex").slice(0, 16)}"`;
}

/**
 * Sets comprehensive CDN and browser caching headers for screenshot responses.
 *
 * Implements a multi-tier caching strategy optimized for global CDN distribution:
 *
 * **Success scenario** (actual screenshots):
 * - Browser cache: Shorter TTL for new content, full TTL for existing content
 * - CDN cache: 2x longer TTL with stale-while-revalidate and stale-if-error
 * - Cloudflare optimizations: Cache tags, edge cache directives
 * - ETags: For conditional requests and precise cache invalidation
 *
 * **Placeholder scenario** (screenshot in progress):
 * - Short cache times to encourage retries
 * - Separate cache tags for monitoring
 *
 * **Error scenario** (failed screenshots):
 * - Very short cache times
 * - Extended stale-if-error for resilience
 *
 * @param headers - HTTP headers object to modify
 * @param scenario - Type of response being cached
 * @param params - Caching configuration and metadata
 */
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
			// Conservative browser cache for new content (max 5min), full TTL for existing
			const browserTtl = isNewContent ? Math.min(cacheTtl, 300) : cacheTtl;
			headers.set(
				"Cache-Control",
				`public, max-age=${browserTtl}, stale-while-revalidate=${Math.floor(cacheTtl * 0.1)}`,
			);

			// Aggressive CDN caching: 2x longer with graceful degradation
			headers.set(
				"CDN-Cache-Control",
				`public, max-age=${cacheTtl * 2}, stale-while-revalidate=${cacheTtl}, stale-if-error=${cacheTtl * 24}`,
			);

			// Cloudflare cache tags for selective purging by workspace/format/type
			headers.set(
				"CF-Cache-Tag",
				`workspace:${workspaceId},format:${format},content:screenshot`,
			);
			headers.set("CF-Edge-Cache", "cache,platform=cf");

			// High-entropy ETag for precise cache invalidation
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
			// Short cache for placeholders to encourage retries when screenshot is ready
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
			// Very short cache for errors, but allow stale content to maintain availability
			headers.set("Cache-Control", "public, max-age=10, must-revalidate");
			headers.set(
				"CDN-Cache-Control",
				"public, max-age=30, stale-if-error=300",
			);
			headers.set("CF-Cache-Tag", `workspace:${workspaceId},content:error`);
			break;
	}

	// Standard security and optimization headers
	headers.set("Vary", "Accept, Accept-Encoding, User-Agent");
	headers.set("X-Content-Type-Options", "nosniff");

	// CDN routing hints for global distribution
	headers.set("X-Edge-Location", "auto");
	headers.set("X-Cache-Regions", "global");

	// Compression hints for image formats that benefit from it
	if (format === "png" || format === "webp") {
		headers.set("X-Compress-Hint", "aggressive");
	}
}

/**
 * Optimized Screenshot API Route Handler
 *
 * This endpoint provides high-performance screenshot generation with:
 * - Request deduplication (prevents duplicate work)
 * - Quota management (rate limiting per user)
 * - S3 streaming (memory-efficient file serving)
 * - Multi-tier caching (browser + CDN)
 * - Conditional requests (304 Not Modified support)
 * - Error resilience (graceful fallbacks)
 *
 * Request Flow:
 * 1. API key authentication
 * 2. Request parameter validation and normalization
 * 3. Cache key generation
 * 4. Quota validation
 * 5. Request deduplication check
 * 6. Screenshot retrieval or generation
 * 7. S3 streaming response with optimal caching headers
 */
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
			// 1. Authentication: Verify API key and extract workspace info
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

			// 2. Parameter extraction and normalization
			const queryParams = c.req.valid("query");
			const workspaceId = key.metadata.workspaceId;
			const userId = key.userId;

			// Normalize URL and clean up optional parameters
			const transformedParams = {
				...queryParams,
				url: new URL(queryParams.url).toString(),
				selector: queryParams.selector?.trim() || undefined,
			};

			// 3. Generate unique cache key for request deduplication
			const cacheKey = generateCacheKey(workspaceId, transformedParams);
			setMetric(c, "cache-key-generated", 1);

			// 4. Quota validation: Ensure user hasn't exceeded rate limits
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

			// 5. Request deduplication: Prevent multiple requests for same screenshot
			const result = await deduplicateRequest(
				cacheKey,
				async () => {
					// Check if screenshot already exists in database
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
							created: false, // Existing screenshot
						};
					}

					// Screenshot doesn't exist, enqueue new generation job
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
						created: jobResult.created, // New screenshot
					};
				},
				c,
			);

			// 6. Screenshot retrieval and response preparation
			const headers = new Headers();
			let body: ArrayBuffer | Buffer | ReadableStream;
			let contentType: string;
			let cacheScenario: "success" | "placeholder" | "error";
			let screenshotTimestamp: number;
			let s3Metadata: { etag?: string; size?: number } | undefined;

			if (result.data.key) {
				// Screenshot exists in S3, stream it directly to avoid memory overhead
				startTime(c, "s3-fetch");
				try {
					const s3File = s3.file(result.data.key);

					// Get timestamp and metadata for ETag generation
					if (result.data.created) {
						// New screenshot: use current time
						screenshotTimestamp = Date.now();
					} else {
						// Existing screenshot: use S3 file metadata for accuracy
						const fileStat = await s3File.stat();
						screenshotTimestamp = fileStat.lastModified.getTime();
						s3Metadata = {
							etag: fileStat.etag,
							size: fileStat.size,
						};
					}

					// Handle conditional requests (304 Not Modified)
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

					// Return 304 if client has latest version
					if (clientETag === expectedETag) {
						endTime(c, "s3-fetch");
						setMetric(c, "cache-hit-etag", 1);
						return c.body(null, 304, {
							ETag: expectedETag,
							"Cache-Control": "public, max-age=3600",
						});
					}

					// Stream the file directly from S3 (memory efficient)
					const s3Stream = s3File.stream();
					endTime(c, "s3-fetch");
					body = s3Stream;
					contentType = `image/${queryParams.format}`;
					cacheScenario = "success";

					setMetric(c, "screenshot-served", 1);
				} catch (error) {
					// S3 error: fall back to placeholder with retry hint
					endTime(c, "s3-fetch");
					logger.error(
						{ err: error, key: result.data.key },
						"Failed to fetch screenshot from S3",
					);
					body = PLACEHOLDER_IMAGE;
					contentType = "image/png";
					cacheScenario = "error";
					screenshotTimestamp = Date.now();
					headers.set("Retry-After", "5"); // Client should retry in 5 seconds
					setMetric(c, "screenshot-s3-error", 1);
				}
			} else {
				// No screenshot key: either in progress or failed
				body = PLACEHOLDER_IMAGE;
				contentType = "image/png";
				cacheScenario = "placeholder";
				screenshotTimestamp = Date.now();
				headers.set("Retry-After", "10"); // Client should retry in 10 seconds
				setMetric(c, "placeholder-served", 1);
			}

			// 7. Set comprehensive caching headers based on scenario
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

			// 8. Quota consumption: Only charge for new, non-deduplicated screenshots
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
					// Inform client of remaining quota
					headers.set("X-Remaining-Requests", String(quota.remaining));
					if (quota.nextRefillAt) {
						headers.set("X-Refill-At", String(quota.nextRefillAt.getTime()));
					}
				} catch (error) {
					logger.error({ err: error }, "Failed to consume quota");
				}
				endTime(c, "quota-consume");
			}

			// 9. Finalize response headers
			if (body instanceof ReadableStream) {
				// Don't set Content-Length for streaming responses - browser will handle chunked encoding
			} else {
				headers.set("Content-Length", String(body.byteLength));
			}
			headers.set("Content-Type", contentType);
			headers.set("Accept-Ranges", "bytes"); // Enable range requests
			headers.set(
				"Content-Disposition",
				`inline; filename="screenshot.${queryParams.format}"`,
			);

			// Debug and monitoring headers for troubleshooting
			headers.set("X-Deduplicated", result.wasDeduplicated ? "true" : "false");
			headers.set("X-Cache-Key", cacheKey);
			headers.set("X-Content-Fresh", result.data.created ? "true" : "false");
			headers.set("X-Cache-Scenario", cacheScenario);

			// Security headers
			headers.set("X-Robots-Tag", "noindex, nofollow");
			headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

			endTime(c, "total-request");
			return c.body(body, { headers });
		} catch (error) {
			// Global error handler: Log error and return sanitized response
			endTime(c, "total-request");
			setMetric(c, "request-error", 1);

			const errorResponse = createErrorResponse(error, c.get("requestId"));
			return c.json(errorResponse, 500);
		}
	},
);

export default optimizedScreenshots;
