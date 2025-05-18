import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { CreateScreenshotSchema } from "@screenshothis/schemas/screenshots";
import { eq, sql } from "drizzle-orm";
import { objectToCamel } from "ts-case-convert";

import type { Variables } from "#/common/environment";
import { db } from "#/db";
import * as schema from "#/db/schema";
import { auth } from "#/lib/auth";
import { createErrorResponse } from "#/utils/errors";
import { getOrCreateScreenshot } from "#/utils/screenshot";

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

			if (!valid) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			if (!key) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			if (!key.metadata?.workspaceId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { object, created } = await getOrCreateScreenshot(
				key.metadata.workspaceId,
				c.req.valid("query"),
			);

			if (!object) {
				return c.json({ error: "Failed to get or create screenshot" }, 404);
			}

			const contentType = `image/${c.req.valid("query").format}`;
			const headers = new Headers();
			headers.set("content-type", contentType);

			if (created) {
				await db
					.update(schema.requestLimits)
					.set({
						totalRequests: sql`${schema.requestLimits.totalRequests} + 1`,
						remainingRequests: sql`${schema.requestLimits.remainingRequests} - 1`,
					})
					.where(eq(schema.requestLimits.userId, key.userId));
			}

			headers.set("cache-control", "public, max-age=3600");
			headers.set(
				"cdn-cache-control",
				"max-age=3600, stale-while-revalidate=3600, durable",
			);

			return c.body(object, {
				headers,
			});
		} catch (error) {
			const errorResponse = createErrorResponse(error, c.get("requestId"));

			return c.json(errorResponse, 400);
		}
	},
);

export default screenshots;
