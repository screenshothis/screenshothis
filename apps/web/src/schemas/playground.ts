import { z } from "zod";

export const ResourceTypeSchema = z.enum([
	"document",
	"stylesheet",
	"image",
	"media",
	"font",
	"script",
	"texttrack",
	"xhr",
	"fetch",
	"prefetch",
	"eventsource",
	"websocket",
	"manifest",
	"signedexchange",
	"ping",
	"cspviolationreport",
	"preflight",
	"other",
]);

export const PlaygroundFormSchema = z.object({
	url: z
		.string({
			required_error: "URL is required",
		})
		.url({
			message: "Invalid URL",
		}),
	selector: z.string().optional(),
	width: z.number().optional().default(1920),
	height: z.number().optional().default(1080),
	is_mobile: z.coerce.boolean().optional().default(false),
	is_landscape: z.coerce.boolean().optional().default(false),
	has_touch: z.coerce.boolean().optional().default(false),
	format: z.enum(["jpeg", "png", "webp"]).optional().default("jpeg"),
	block_ads: z.coerce.boolean().optional().default(true),
	block_cookie_banners: z.coerce.boolean().optional().default(true),
	block_trackers: z.coerce.boolean().optional().default(true),
	block_requests: z
		.union([z.string(), z.array(z.string())])
		.optional()
		.transform((val) =>
			Array.isArray(val)
				? val
				: (val
						?.split("\n")
						.map((s) => s.trim())
						.filter(Boolean) ?? []),
		),
	block_resources: z.array(ResourceTypeSchema).optional(),
	cache_key: z.string().optional(),
});
