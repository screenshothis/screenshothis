import { z } from "zod";

export const PlaygroundFormSchema = z.object({
	url: z
		.string({
			required_error: "URL is required",
		})
		.url({
			message: "Invalid URL",
		}),
	width: z.number().default(1920),
	height: z.number().default(1080),
	format: z.enum(["jpeg", "png", "webp"]).default("jpeg"),
	block_ads: z.coerce.boolean().default(true),
	block_cookie_banners: z.coerce.boolean().default(true),
	block_trackers: z.coerce.boolean().default(true),
	cache_key: z.string(),
});
