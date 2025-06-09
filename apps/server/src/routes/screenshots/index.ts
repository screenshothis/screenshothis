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
import { generateCacheKey } from "#/utils/deduplication";
import { createErrorResponse } from "#/utils/errors";

// Import action functions
import { authenticateAndValidateScreenshot } from "#/actions/authenticate-and-validate-screenshot";
import { buildScreenshotResponse } from "#/actions/build-screenshot-response";
import { ensureQuotaAvailableForUser } from "#/actions/ensure-quota-available";
import { retrieveScreenshot } from "#/actions/retrieve-screenshot";

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
			const queryParams = c.req.valid("query");

			const authResult = await authenticateAndValidateScreenshot(
				c,
				queryParams,
			);
			if (authResult instanceof Response) {
				return authResult;
			}

			const { workspaceId, userId, transformedParams } = authResult;

			const cacheKey = generateCacheKey(workspaceId, transformedParams);
			setMetric(c, "cache-key-generated", 1);

			const quotaResp = await ensureQuotaAvailableForUser(userId, c);
			if (quotaResp instanceof Response) {
				return quotaResp;
			}

			const retrieval = await retrieveScreenshot(
				c,
				cacheKey,
				workspaceId,
				userId,
				transformedParams,
				queryParams,
			);

			if (retrieval.body === null) {
				endTime(c, "total-request");
				return c.body(null, 304, {
					ETag: retrieval.validatedETag || "",
					"Cache-Control": "public, max-age=3600",
				});
			}

			const response = await buildScreenshotResponse(
				c,
				retrieval,
				queryParams,
				cacheKey,
				workspaceId,
				userId,
			);
			endTime(c, "total-request");
			return response;
		} catch (error) {
			endTime(c, "total-request");
			setMetric(c, "request-error", 1);
			const errorResponse = createErrorResponse(error, c.get("requestId"));
			return c.json(errorResponse, 500);
		}
	},
);

export default optimizedScreenshots;
