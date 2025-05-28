import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { CreateScreenshotSchema } from "@screenshothis/schemas/screenshots";
import { objectToCamel } from "ts-case-convert";

import type { Variables } from "#/common/environment";
import { auth } from "#/lib/auth";
import { s3 } from "#/lib/s3";
import {
	enqueueScreenshotJob,
	getExistingScreenshotKey,
} from "#/lib/screenshot-queue";
import { createErrorResponse } from "#/utils/errors";

const PLACEHOLDER_IMAGE = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5K7f0AAAAASUVORK5CYII=",
	"base64",
);

const screenshots = new OpenAPIHono<{ Variables: Variables }>().openapi(
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
				description: "Successful response",
			},
		},
	}),
	async (c) => {
		try {
			const { valid, key } = await auth.api.verifyApiKey({
				body: {
					key: c.req.valid("query").apiKey,
				},
			});

			if (!valid || !key || !key.metadata?.workspaceId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const queryParams = c.req.valid("query");
			const workspaceId = key.metadata.workspaceId;
			const userId = key.userId;

			let existingKey: string | null = null;
			try {
				existingKey = await getExistingScreenshotKey(workspaceId, queryParams);
			} catch (error) {
				console.error("Error checking for existing screenshot:", error);

				existingKey = null;
			}

			let raceResult: { key: string; created: boolean } | "timeout";

			if (existingKey) {
				raceResult = { key: existingKey, created: false };
			} else {
				// Not cached; enqueue generation and apply 15s timeout
				const jobPromise = await enqueueScreenshotJob(
					workspaceId,
					userId,
					queryParams,
				);

				const TIMEOUT_MS = 15_000;
				let timeoutId: ReturnType<typeof setTimeout> | null = null;
				const timer = new Promise<"timeout">((resolve) => {
					timeoutId = setTimeout(() => resolve("timeout" as const), TIMEOUT_MS);
				});

				raceResult = await Promise.race([jobPromise, timer]);

				if (timeoutId) {
					clearTimeout(timeoutId);
				}
			}

			const headers = new Headers();
			let body: ArrayBuffer | Buffer | null = null;
			let contentType: string;

			if (raceResult === "timeout") {
				// Return 1x1 placeholder and allow client to retry
				body = PLACEHOLDER_IMAGE;
				contentType = "image/png";
				// Prevent caching of placeholder so user can retry quickly
				headers.set(
					"Cache-Control",
					"no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0",
				);
				headers.set("CDN-Cache-Control", "no-cache, no-store, max-age=0");
			} else {
				const { key: objectKey } = raceResult as {
					key: string;
					created: boolean;
				};
				if (!objectKey) {
					return c.json({ error: "Unauthorized" }, 401);
				}
				try {
					body = await s3.file(objectKey).arrayBuffer();
				} catch (e) {
					return c.json({ error: "Screenshot not ready" }, 503, {
						headers: ["Retry-After: 5"],
					});
				}
				contentType = `image/${queryParams.format}`;

				if (queryParams.isCached) {
					const cacheTtl = queryParams.cacheTtl;
					headers.set(
						"Cache-Control",
						`public, max-age=${cacheTtl}, s-maxage=${cacheTtl}, stale-while-revalidate=${cacheTtl}, durable`,
					);
					headers.set(
						"CDN-Cache-Control",
						`max-age=${cacheTtl}, stale-while-revalidate=${cacheTtl}, durable`,
					);
				} else {
					headers.set(
						"Cache-Control",
						"no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0",
					);
					headers.set(
						"CDN-Cache-Control",
						"no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0",
					);
				}
			}

			headers.set("Content-Length", String(body.byteLength));
			headers.set("Content-Type", contentType);
			headers.set("Accept-Ranges", "bytes");
			headers.set(
				"Content-Disposition",
				`inline; filename="screenshot.${queryParams.format}"`,
			);

			return c.body(body ?? new Uint8Array(), { headers });
		} catch (error) {
			const errorResponse = createErrorResponse(error, c.get("requestId"));

			return c.json(errorResponse, 400);
		}
	},
);

export default screenshots;
