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
	width: z.number().optional().default(1920),
	height: z.number().optional().default(1080),
	isMobile: z.coerce.boolean().optional().default(false),
	isLandscape: z.coerce.boolean().optional().default(false),
	hasTouch: z.coerce.boolean().optional().default(false),
	format: FormatSchema.optional().default("jpeg"),
	blockAds: z.coerce.boolean().optional().default(true),
	blockCookieBanners: z.coerce.boolean().optional().default(true),
	blockTrackers: z.coerce.boolean().optional().default(true),
	blockRequests: z
		.string()
		.transform((value) => value.split("\n"))
		.optional()
		.default(""),
	blockResources: ResourceTypeSchema.array().optional().default([]),
	prefersColorScheme: PrefersColorSchemeSchema.optional().default("light"),
	prefersReducedMotion:
		PrefersReducedMotionSchema.optional().default("no-preference"),
	createdAt: z.number(),
	updatedAt: z.number().nullish(),
});

export const CreateScreenshotSchema = ScreenshotSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const ScreenshotsFilterSchema = z.object({
	q: z.string().optional(),
});
