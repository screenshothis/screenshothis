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
	api_key: z
		.string({
			required_error: "API key is required",
		})
		.min(32, {
			message: "Invalid API key",
		}),
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
	duration: z.number().optional(),
	is_cached: z
		.preprocess((val) => String(val).toLowerCase() === "true", z.boolean())
		.optional()
		.default(false),
	cache_ttl: z.number().min(3600).max(31622400).optional().default(3600),
	cache_key: z.string().optional(),
	user_agent: z.string().optional(),
	headers: z
		.string()
		.refine(
			(val) => {
				const lines = val
					.split("\n")
					.map((l) => l.trim())
					.filter((l): l is string => l.length > 0);
				if (lines.length === 0) return true; // allow empty string handled by optional()
				// Header value: visible ASCII (0x20-0x7E) only – excludes control chars (0x00–0x1F, 0x7F)
				const headerRegex = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+:\s*[ -~]+$/;
				return lines.every((line) => headerRegex.test(line));
			},
			{
				message: "Headers must be in the format 'Name: Value' (one per line)",
			},
		)
		.transform((value) =>
			value
				.split("\n")
				.map((line) => line.trim())
				.filter((l): l is string => l.length > 0),
		)
		.optional(),
	cookies: z
		.string()
		.refine(
			(val) => {
				const lines = val
					.split("\n")
					.map((l) => l.trim())
					.filter((l): l is string => l.length > 0);
				if (lines.length === 0) return true;

				const allowedAttrs = [
					"domain",
					"path",
					"expires",
					"max-age",
					"samesite",
					"secure",
					"httponly",
				];

				return lines.every((line) => {
					const segments = line.split(";").map((seg) => seg.trim());
					if (segments.length === 0) return false;
					// first segment must be name=value
					const nameValue = segments[0] ?? "";
					const attrs = segments.slice(1);
					if (!/^([^=\s;]+)=([^;\s]*)$/.test(nameValue)) return false;

					// validate attributes
					return attrs.every((attr) => {
						if (!attr) return false;
						if (attr === "Secure" || attr === "HttpOnly") return true;
						const attrNameLower = attr.split("=")[0]?.trim().toLowerCase();
						if (!attrNameLower) return false;
						return allowedAttrs.includes(attrNameLower);
					});
				});
			},
			{
				message:
					"Cookies must follow the standard Set-Cookie syntax (name=value; Attr=Value ...)",
			},
		)
		.transform((value) =>
			value
				.split("\n")
				.map((line) => line.trim())
				.filter((l): l is string => l.length > 0),
		)
		.optional(),
	bypass_csp: z
		.preprocess((val) => String(val).toLowerCase() === "true", z.boolean())
		.optional()
		.default(false),
	created_at: z.date().nullish(),
	updated_at: z.date().nullish(),
});

export const CreateScreenshotSchema = ScreenshotSchema.omit({
	id: true,
	duration: true,
	created_at: true,
	updated_at: true,
});

export const ScreenshotsFilterSchema = z.object({
	q: z.string().optional(),
});
