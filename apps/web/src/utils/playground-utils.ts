import { CreateScreenshotSchema } from "@screenshothis/schemas/screenshots";
import type { z } from "zod";

export type PlaygroundFormValues = z.input<typeof CreateScreenshotSchema>;

// Extract default values from the Zod schema so we can compare form values
// and avoid including params that match their defaults.
// We fake the required fields with placeholders for parsing.
const _dummyRequiredFields = {
	api_key: "x".repeat(32),
	url: "https://example.com",
};

const DEFAULT_VALUES: Partial<PlaygroundFormValues> = (() => {
	try {
		// Parse an empty object to get defaults while satisfying required fields
		return CreateScreenshotSchema.parse(
			_dummyRequiredFields,
		) as PlaygroundFormValues;
	} catch {
		// Fallback in case the schema requirements change unexpectedly
		return {} as Partial<PlaygroundFormValues>;
	}
})();

/**
 * Generates the API URL with query parameters based on form values
 */
export function generateApiUrl(values: PlaygroundFormValues): string {
	const baseUrl = "https://api.screenshothis.com/v1/screenshots/take";
	const params = new URLSearchParams();

	// Required parameters
	params.set("api_key", values.api_key || "your-api-key");
	params.set("url", values.url || "https://polar.sh");

	// Optional parameters - only add if they differ from their defaults
	const addIfNotDefault = <K extends keyof PlaygroundFormValues>(
		key: K,
		value: PlaygroundFormValues[K],
		formatter: (v: NonNullable<typeof value>) => string = (v) => String(v),
	) => {
		const def = DEFAULT_VALUES[key as keyof PlaygroundFormValues] as
			| typeof value
			| undefined;
		if (value === undefined || value === null) return;
		if (def !== undefined && value === def) return;
		params.set(key as string, formatter(value as NonNullable<typeof value>));
	};

	addIfNotDefault("selector", values.selector);
	addIfNotDefault("width", values.width, (v) => v.toString());
	addIfNotDefault("height", values.height, (v) => v.toString());
	addIfNotDefault("is_mobile", values.is_mobile, (v) => v.toString());
	addIfNotDefault("is_landscape", values.is_landscape, (v) => v.toString());
	addIfNotDefault("has_touch", values.has_touch, (v) => v.toString());
	addIfNotDefault("device_scale_factor", values.device_scale_factor, (v) =>
		v.toString(),
	);
	addIfNotDefault("full_page", values.full_page, (v) => v.toString());
	addIfNotDefault("full_page_scroll", values.full_page_scroll, (v) =>
		v.toString(),
	);
	addIfNotDefault(
		"full_page_scroll_duration",
		values.full_page_scroll_duration,
		(v) => v.toString(),
	);
	addIfNotDefault("format", values.format);
	if (values.quality !== undefined && values.quality !== null) {
		addIfNotDefault("quality", values.quality, (v) => v.toString());
	}
	addIfNotDefault("block_ads", values.block_ads, (v) => v.toString());
	addIfNotDefault("block_cookie_banners", values.block_cookie_banners, (v) =>
		v.toString(),
	);
	addIfNotDefault("block_trackers", values.block_trackers, (v) => v.toString());
	addIfNotDefault("bypass_csp", values.bypass_csp, (v) => v.toString());
	addIfNotDefault("prefers_color_scheme", values.prefers_color_scheme);
	addIfNotDefault("prefers_reduced_motion", values.prefers_reduced_motion);
	addIfNotDefault("is_cached", values.is_cached, (v) => v.toString());
	addIfNotDefault("cache_ttl", values.cache_ttl, (v) => v.toString());
	if (values.cache_key) params.set("cache_key", values.cache_key);
	if (values.user_agent) params.set("user_agent", values.user_agent);

	// Handle block_requests (newline-separated)
	if (values.block_requests) {
		const requests = values.block_requests
			.split("\n")
			.map((r) => r.trim())
			.filter(Boolean);
		for (const request of requests) {
			params.append("block_requests", request);
		}
	}

	// Handle block_resources (array)
	if (values.block_resources?.length) {
		for (const resource of values.block_resources) {
			params.append("block_resources", resource);
		}
	}

	// Handle headers (newline-separated, validate format)
	if (values.headers) {
		const headerRegex = /^[a-zA-Z0-9!#$%&'*+.^_`|~-]+:\s*[^\r\n]*$/;
		const headers = values.headers
			.split("\n")
			.map((h) => h.trim())
			.filter(Boolean)
			.filter((h) => headerRegex.test(h));
		for (const header of headers) {
			params.append("headers", header);
		}
	}

	// Handle cookies (newline-separated, validate format)
	if (values.cookies) {
		const cookieRegex = /^[a-zA-Z0-9!#$%&'*+\-.^_`|~]+=[^;\r\n]*$/;
		const cookies = values.cookies
			.split("\n")
			.map((c) => c.trim())
			.filter(Boolean)
			.filter((c) => cookieRegex.test(c));
		for (const cookie of cookies) {
			params.append("cookies", cookie);
		}
	}

	const generatedUrl = `${baseUrl}?${params.toString()}`;

	if (generatedUrl.length > 2000) {
		console.warn(
			`Generated URL is ${generatedUrl.length} characters long, which may cause issues with some browsers or servers.`,
		);
	}

	return generatedUrl;
}

/**
 * Formats the API URL for display with proper line breaks
 */
export function formatApiUrlForDisplay(values: PlaygroundFormValues): string {
	const url = generateApiUrl(values);
	const [baseUrl, queryString] = url.split("?");

	if (!queryString) return baseUrl;

	const params = new URLSearchParams(queryString);
	const lines = [baseUrl];

	for (const [key, value] of params.entries()) {
		lines.push(`   &${key}=${value}`);
	}

	return lines.join("\n");
}

/**
 * Validates if a URL is valid
 */
export function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Validates header format
 */
export function isValidHeader(header: string): boolean {
	const headerRegex = /^[\w!#$%&'*+.^`|~-]+:\s*[ -~]+$/i;
	return headerRegex.test(header);
}

/**
 * Validates cookie format
 */
export function isValidCookie(cookie: string): boolean {
	const cookieRegex = /[^=\s;]+=[^;]+/;
	return cookieRegex.test(cookie);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (error) {
		console.warn("Failed to copy to clipboard:", error);
		return false;
	}
}
