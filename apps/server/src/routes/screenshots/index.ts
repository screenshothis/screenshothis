import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from "valibot";

import { getOrCreateScreenshot } from "#/utils/screenshot";
import { CreateScreenshotParamsSchema } from "./schema";

const screenshots = new Hono();

screenshots.post(
	"/",
	describeRoute({
		description: "Take a screenshot of a website",
		responses: {
			200: {
				description: "Successful response",
				content: {
					"image/jpeg": { schema: resolver(v.string()) },
					"image/png": { schema: resolver(v.string()) },
					"image/webp": { schema: resolver(v.string()) },
				},
			},
		},
	}),
	validator("query", CreateScreenshotParamsSchema),
	async (c) => {
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
	},
);

export default screenshots;
