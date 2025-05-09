import { z } from "@hono/zod-openapi";
import { objectToCamel } from "ts-case-convert";

export const CreateScreenshotParamsSchema = z
	.object({
		url: z.string().url().openapi({
			description: "The url to screenshot",
			example: "https://www.google.com",
		}),
		width: z.coerce.number().optional().default(1920).openapi({
			description: "The width of the screenshot",
			example: 1920,
		}),
		height: z.coerce.number().optional().default(1080).openapi({
			description: "The height of the screenshot",
			example: 1080,
		}),
		format: z.enum(["jpeg", "png", "webp"]).optional().default("jpeg").openapi({
			description: "The format of the screenshot",
			example: "jpeg",
		}),
		block_ads: z.coerce.boolean().optional().default(true).openapi({
			description: "Whether to block ads",
			example: true,
		}),
		block_cookie_banners: z.coerce.boolean().optional().default(true).openapi({
			description: "Whether to block cookie banners",
			example: true,
		}),
		block_trackers: z.coerce.boolean().optional().default(true).openapi({
			description: "Whether to block trackers",
			example: true,
		}),
		block_requests: z
			.union([z.string(), z.array(z.string())])
			.optional()
			.transform((val) => {
				if (!val) return [];
				if (Array.isArray(val)) return val;
				return [val];
			})
			.openapi({
				type: "array",
				items: { type: "string", example: "example.com" },
				minItems: 1,
				description:
					"List of requests to block. Can be specified as block_requests=foo or multiple times: block_requests=foo&block_requests=bar",
			}),
		cache_key: z.string().optional().openapi({
			description:
				"Optional cache key to differentiate screenshots of the same page.",
			example: "v2-20240601",
		}),
	})
	.transform((data) => objectToCamel(data));
