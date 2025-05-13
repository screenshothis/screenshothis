import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { CreateScreenshotSchema } from "@screenshothis/schemas/screenshots";
import { objectToCamel } from "ts-case-convert";

import type { Variables } from "#/common/environment";
import { unkey } from "#/lib/unkey";
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
			const { object, created } = await getOrCreateScreenshot(
				c.get("workspaceId"),
				c.req.valid("query"),
			);

			if (!object) {
				return c.json({ error: "Failed to get or create screenshot" }, 404);
			}

			const contentType = `image/${c.req.valid("query").format}`;
			const headers = new Headers();
			if (!headers.has("content-type")) {
				headers.set("content-type", contentType);
			}

			if (created) {
				const key = c.get("unkey");
				if (key?.keyId) {
					await unkey.keys.updateRemaining({
						keyId: key.keyId,
						op: "decrement",
						value: 1,
					});
				}
			}

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
