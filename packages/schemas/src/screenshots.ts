import { z } from "zod";
import "zod-openapi/extend";
import { booleanSchema } from "./utils/zod.ts";

export const MAX_HEADERS_SIZE = 8192; // 8 KB (RFC 7230 guideline)
export const MAX_COOKIES_SIZE = 4096; // 4 KB (typical cookie size limit)

export const FormatSchema = z.enum(["jpeg", "png", "webp"]).openapi({
	description: "Image format for the screenshot output",
	example: "jpeg",
});

export const ResourceTypeSchema = z
	.enum([
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
	])
	.openapi({
		description:
			"Types of web resources that can be blocked during screenshot capture",
		example: "script",
	});

export const PrefersColorSchemeSchema = z.enum(["light", "dark"]).openapi({
	description: "Preferred color scheme for rendering the webpage",
	example: "light",
});

export const PrefersReducedMotionSchema = z
	.enum(["no-preference", "reduce"])
	.openapi({
		description: "Preference for reduced motion accessibility setting",
		example: "no-preference",
	});

export const ScreenshotSchema = z.object({
	id: z.string().openapi({
		description: "Unique identifier for the screenshot record",
		example: "scr_1234567890abcdef",
	}),
	api_key: z
		.string({
			required_error: "API key is required",
		})
		.min(32, {
			message: "Invalid API key",
		})
		.openapi({
			description:
				"API key used to authenticate the request. Must be at least 32 characters long.",
			example: "sk_live_abcdef1234567890abcdef1234567890",
		}),
	url: z
		.string({
			required_error: "URL is required",
		})
		.url({
			message: "Invalid URL",
		})
		.openapi({
			description:
				"Target URL of the website to capture. Must be a valid HTTP or HTTPS URL.",
			example: "https://example.com",
		}),
	selector: z.string().nullish().openapi({
		description:
			"CSS selector to capture a specific element instead of the full page. If provided, only the matching element will be screenshotted.",
		example: ".main-content",
	}),
	width: z.coerce.number().optional().default(1920).openapi({
		description: "Width of the viewport in pixels for the screenshot",
		example: 1920,
		minimum: 1,
		maximum: 7680,
	}),
	height: z.coerce.number().optional().default(1080).openapi({
		description: "Height of the viewport in pixels for the screenshot",
		example: 1080,
		minimum: 1,
		maximum: 4320,
	}),
	is_mobile: booleanSchema.optional().default(false).openapi({
		description:
			"Enable mobile device emulation with touch events and mobile user agent",
		example: false,
	}),
	is_landscape: booleanSchema.optional().default(false).openapi({
		description:
			"Set device orientation to landscape mode when mobile emulation is enabled",
		example: false,
	}),
	has_touch: booleanSchema.optional().default(false).openapi({
		description: "Enable touch event support for the emulated device",
		example: false,
	}),
	device_scale_factor: z.coerce.number().optional().default(1).openapi({
		description:
			"Device pixel ratio for high-DPI displays. Higher values produce sharper images on retina displays.",
		example: 1,
		minimum: 0.1,
		maximum: 3,
	}),
	full_page: booleanSchema.optional().default(false).openapi({
		description: "Capture the full page instead of just the viewport",
		example: false,
	}),
	full_page_scroll: booleanSchema.optional().default(true).openapi({
		description: "Scroll the full page to trigger lazy loading",
		example: true,
	}),
	full_page_scroll_duration: z.coerce
		.number()
		.min(0, { message: "Must be ≥ 0 ms" })
		.max(30_000, { message: "Must be ≤ 30 000 ms" })
		.optional()
		.default(400)
		.openapi({
			description: "Duration of the full page scroll in milliseconds",
			example: 400,
			minimum: 0,
		}),
	format: FormatSchema.optional().default("jpeg").openapi({
		description:
			"Output image format. JPEG offers smaller file sizes, PNG supports transparency, WebP provides modern compression.",
		example: "jpeg",
	}),
	quality: z.coerce.number().min(20).max(100).optional().default(80).openapi({
		description:
			"Image compression quality from 20 (lowest/smallest) to 100 (highest/largest). Only applies to JPEG and WebP formats.",
		example: 80,
		minimum: 20,
		maximum: 100,
	}),
	block_ads: booleanSchema.optional().default(false).openapi({
		description:
			"Block advertisements and ad-related content from loading during screenshot capture",
		example: false,
	}),
	block_cookie_banners: booleanSchema.optional().default(false).openapi({
		description:
			"Automatically hide cookie consent banners and GDPR notices for cleaner screenshots",
		example: false,
	}),
	block_trackers: booleanSchema.optional().default(false).openapi({
		description:
			"Block tracking scripts and analytics to improve page load speed and privacy",
		example: false,
	}),
	block_requests: z
		.string()
		.transform((value) => value.split("\n"))
		.optional()
		.openapi({
			description:
				"Newline-separated list of URL patterns to block during page load. Supports wildcards and regex patterns.",
			example: "*.doubleclick.net\n*.googletagmanager.com\n*/analytics/*",
		}),
	block_resources: ResourceTypeSchema.array()
		.optional()
		.default([])
		.openapi({
			description:
				"Array of resource types to prevent from loading. Useful for faster page loads and cleaner screenshots.",
			example: ["script", "stylesheet", "font"],
		}),
	prefers_color_scheme: PrefersColorSchemeSchema.optional()
		.default("light")
		.openapi({
			description:
				"Set the preferred color scheme for websites that support dark/light mode theming",
			example: "light",
		}),
	prefers_reduced_motion: PrefersReducedMotionSchema.optional()
		.default("no-preference")
		.openapi({
			description:
				"Accessibility setting to reduce animations and transitions for motion-sensitive users",
			example: "no-preference",
		}),
	duration: z.coerce.number().optional().openapi({
		description:
			"Time taken to capture the screenshot in milliseconds (read-only, populated after processing)",
		example: 2500,
	}),
	is_cached: booleanSchema.optional().default(false).openapi({
		description:
			"Whether to use cached version of the screenshot if available, or force a fresh capture",
		example: false,
	}),
	cache_ttl: z
		.number()
		.min(3600)
		.max(31622400)
		.optional()
		.default(3600)
		.openapi({
			description:
				"Cache expiration time in seconds. Minimum 1 hour (3600), maximum 1 year (31622400)",
			example: 3600,
			minimum: 3600,
			maximum: 31622400,
		}),
	cache_key: z.string().optional().openapi({
		description:
			"Custom cache key for grouping related screenshots. Auto-generated if not provided.",
		example: "homepage-desktop-light",
	}),
	user_agent: z
		.string()
		.max(1024, { message: "User agent string is too long (max 1024 chars)" })
		.optional()
		.openapi({
			description: "User agent to use for the screenshot",
			example:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		}),
	headers: z
		.string()
		.max(MAX_HEADERS_SIZE, {
			message: `Headers exceed maximum allowed size of ${MAX_HEADERS_SIZE} characters`,
		})
		.refine(
			(val) => {
				const lines = val
					.split("\n")
					.map((l) => l.trim())
					.filter((l): l is string => l.length > 0);
				if (lines.length === 0) return true; // allow empty string handled by optional()
				// Header value: visible ASCII (0x20-0x7E) only – excludes control chars (0x00–0x1F, 0x7F)
				const headerRegex = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+:\s*[ -~]*$/;
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
				.filter((l): l is string => l.length > 0)
				.map((line) => {
					const colonIdx = line.indexOf(":");
					const name = line.slice(0, colonIdx).trim().toLowerCase();
					const value = line.slice(colonIdx + 1).trim();
					return { name, value } as { name: string; value: string };
				}),
		)
		.optional()
		.openapi({
			description:
				"Custom HTTP headers to send with the request in 'Name: Value' format, one per line. Maximum 8KB total size.",
			example:
				"User-Agent: MyBot/1.0\nAuthorization: Bearer token123\nX-Custom-Header: value",
		}),
	cookies: z
		.string()
		.max(MAX_COOKIES_SIZE, {
			message: `Cookies exceed maximum allowed size of ${MAX_COOKIES_SIZE} characters`,
		})
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
				.filter((l): l is string => l.length > 0)
				.map((line) => {
					const segments = line.split(";").map((s) => s.trim());
					if (segments.length === 0 || !segments[0]) return null;
					const [nameValue, ...attrParts] = segments as [string, ...string[]];
					const eqIdx = nameValue.indexOf("=");
					if (eqIdx === -1) return null;
					const cookieObj: {
						name: string;
						value: string;
						domain?: string;
						path?: string;
						expires?: number;
						sameSite?: "lax" | "strict" | "none";
						secure?: boolean;
						httpOnly?: boolean;
					} = {
						name: nameValue.slice(0, eqIdx).trim(),
						value: nameValue.slice(eqIdx + 1).trim(),
					};

					for (const attr of attrParts) {
						const [attrNameRaw, ...attrValParts] = attr.split("=");
						if (!attrNameRaw) continue;
						const attrName = attrNameRaw.trim().toLowerCase();
						const attrVal = attrValParts.join("=").trim();

						switch (attrName) {
							case "domain":
								cookieObj.domain = attrVal.startsWith(".")
									? attrVal.substring(1)
									: attrVal;
								break;
							case "path":
								cookieObj.path = attrVal || "/";
								break;
							case "expires": {
								const ts = Date.parse(attrVal);
								if (!Number.isNaN(ts))
									cookieObj.expires = Math.floor(ts / 1000);
								break;
							}
							case "samesite":
								cookieObj.sameSite = attrVal.toLowerCase() as
									| "lax"
									| "strict"
									| "none";
								break;
							case "secure":
								cookieObj.secure = true;
								break;
							case "httponly":
								cookieObj.httpOnly = true;
								break;
							case "max-age": {
								const maxAge = Number.parseInt(attrVal, 10);
								if (!Number.isNaN(maxAge)) {
									cookieObj.expires = Math.floor(Date.now() / 1000) + maxAge;
								}
								break;
							}
						}
					}
					return cookieObj;
				})
				.filter(
					(obj): obj is { name: string; value: string; [k: string]: unknown } =>
						obj !== null,
				),
		)
		.optional()
		.openapi({
			description:
				"Cookies to set before capturing the screenshot using Set-Cookie syntax (name=value; attributes), one per line. Maximum 4KB total size.",
			example:
				"session_id=abc123; Domain=example.com; Path=/; Secure\nuser_pref=dark_mode; Max-Age=3600",
		}),
	bypass_csp: booleanSchema.optional().default(false).openapi({
		description:
			"Bypass Content Security Policy restrictions that might prevent proper page rendering or script execution",
		example: false,
	}),
	created_at: z.date().nullish().openapi({
		description: "Timestamp when the screenshot record was created (read-only)",
		example: "2024-01-15T10:30:00.000Z",
	}),
	updated_at: z.date().nullish().openapi({
		description:
			"Timestamp when the screenshot record was last updated (read-only)",
		example: "2024-01-15T10:35:00.000Z",
	}),
});

export const CreateScreenshotSchema = ScreenshotSchema.omit({
	id: true,
	duration: true,
	created_at: true,
	updated_at: true,
}).openapi({
	description:
		"Schema for creating a new screenshot with all configuration options for capture settings, device emulation, content blocking, and caching behavior",
});

export const ScreenshotsFilterSchema = z
	.object({
		q: z.string().optional().openapi({
			description:
				"Search query to filter screenshots by URL, cache key, or other metadata",
			example: "example.com",
		}),
	})
	.openapi({
		description:
			"Filter parameters for querying and searching through screenshot records",
	});
