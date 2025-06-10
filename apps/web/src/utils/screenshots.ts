import wildcardMatch from "wildcard-match";

/**
 * Determines whether a given URL is permitted based on a list of allowed origin patterns.
 *
 * Returns `true` if the URL's origin or hostname matches any of the provided patterns, or if the patterns include a wildcard (`"*"` or `"**"`); otherwise, returns `false`.
 *
 * @param allowedOrigins - List of origin patterns to match against.
 * @param url - The URL to check for permission.
 * @returns `true` if the URL is allowed; otherwise, `false`.
 */
export function isScreenshotAllowed(allowedOrigins: string[], url: string) {
	if (allowedOrigins.some((pattern) => pattern === "*" || pattern === "**")) {
		return true;
	}

	const targetUrl = new URL(url);
	const match = wildcardMatch(allowedOrigins, { separator: false });
	return match(targetUrl.origin) || match(targetUrl.hostname);
}
