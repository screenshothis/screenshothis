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

const optimizedScreenshots = new OpenAPIHono<{
	Variables: Variables;
}>().openapi(
	createRoute({
		method: "get",
		path: "/take-optimized",
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
				description: "Optimized screenshot response",
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
			let body: ArrayBuffer | Buffer;
			let contentType: string;

			if (result.data.key) {
				startTime(c, "s3-fetch");
				try {
					body = await s3.file(result.data.key).arrayBuffer();
					endTime(c, "s3-fetch");
					contentType = `image/${queryParams.format}`;

					if (queryParams.isCached) {
						const cacheTtl = queryParams.cacheTtl || 3600;
						headers.set(
							"Cache-Control",
							`public, max-age=${cacheTtl}, s-maxage=${cacheTtl}, stale-while-revalidate=${cacheTtl}`,
						);
					}

					setMetric(c, "screenshot-served", 1);
				} catch (error) {
					endTime(c, "s3-fetch");
					logger.error(
						{ err: error, key: result.data.key },
						"Failed to fetch screenshot from S3",
					);
					body = PLACEHOLDER_IMAGE;
					contentType = "image/png";
					headers.set("Retry-After", "5");
					setMetric(c, "screenshot-s3-error", 1);
				}
			} else {
				body = PLACEHOLDER_IMAGE;
				contentType = "image/png";

				headers.set(
					"Cache-Control",
					"no-cache, no-store, must-revalidate, max-age=0",
				);
				headers.set("Retry-After", "10");

				setMetric(c, "placeholder-served", 1);
			}

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

			headers.set("Content-Length", String(body.byteLength));
			headers.set("Content-Type", contentType);
			headers.set("Accept-Ranges", "bytes");
			headers.set(
				"Content-Disposition",
				`inline; filename="screenshot.${queryParams.format}"`,
			);

			headers.set("X-Deduplicated", result.wasDeduplicated ? "true" : "false");
			headers.set("X-Cache-Key", cacheKey);

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
