import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import type { Variables } from "#/common/environment";
import { createErrorResponse } from "#/utils/errors";
import { getOrCreateScreenshot } from "#/utils/screenshot";
import { CreateScreenshotParamsSchema } from "./schema";

const screenshots = new OpenAPIHono<{ Variables: Variables }>().openapi(
	createRoute({
		method: "get",
		path: "/take",
		request: {
			query: CreateScreenshotParamsSchema,
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
			const { object } = await getOrCreateScreenshot(c.req.valid("query"));

			if (!object) {
				return c.json({ error: "Failed to get or create screenshot" }, 404);
			}

			const contentType = `image/${c.req.valid("query").format}`;
			const headers = new Headers();
			if (!headers.has("content-type")) {
				headers.set("content-type", contentType);
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
