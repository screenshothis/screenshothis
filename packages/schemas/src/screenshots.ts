import { z } from "zod";

export const FormatSchema = z.enum(["jpeg", "png", "webp"]);
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
export const PrefersColorSchemeSchema = z.enum(["light", "dark"]);
export const PrefersReducedMotionSchema = z.enum(["no-preference", "reduce"]);

export const ScreenshotSchema = z.object({
	id: z.string(),
	url: z
		.string({
			required_error: "URL is required",
		})
		.url({
			message: "Invalid URL",
		}),
	selector: z.string().nullish(),
	width: z.coerce.number().optional().default(1920),
	height: z.coerce.number().optional().default(1080),
	is_mobile: z
		.preprocess((val) => String(val).toLowerCase() === "true", z.boolean())
		.optional()
		.default(false),
	is_landscape: z
		.preprocess((val) => String(val).toLowerCase() === "true", z.boolean())
		.optional()
		.default(false),
	has_touch: z
		.preprocess((val) => String(val).toLowerCase() === "true", z.boolean())
		.optional()
		.default(false),
	device_scale_factor: z.coerce.number().optional().default(1),
	format: FormatSchema.optional().default("jpeg"),
	block_ads: z
		.preprocess((val) => String(val).toLowerCase() === "true", z.boolean())
		.optional()
		.default(false),
	block_cookie_banners: z
		.preprocess((val) => String(val).toLowerCase() === "true", z.boolean())
		.optional()
		.default(false),
	block_trackers: z
		.preprocess((val) => String(val).toLowerCase() === "true", z.boolean())
		.optional()
		.default(false),
	block_requests: z
		.string()
		.transform((value) => value.split("\n"))
		.optional(),
	block_resources: ResourceTypeSchema.array().optional().default([]),
	prefers_color_scheme: PrefersColorSchemeSchema.optional().default("light"),
	prefers_reduced_motion:
		PrefersReducedMotionSchema.optional().default("no-preference"),
	created_at: z.date(),
	updated_at: z.date().nullish(),
});

export const CreateScreenshotSchema = ScreenshotSchema.omit({
	id: true,
	created_at: true,
	updated_at: true,
});

export const ScreenshotsFilterSchema = z.object({
	q: z.string().optional(),
});
