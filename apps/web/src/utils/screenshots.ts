import wildcardMatch from "wildcard-match";

export function isScreenshotAllowed(allowedOrigins: string[], url: string) {
	if (allowedOrigins.some((pattern) => pattern === "*" || pattern === "**")) {
		return true;
	}

	const targetUrl = new URL(url);
	const match = wildcardMatch(allowedOrigins, { separator: false });
	return match(targetUrl.origin) || match(targetUrl.hostname);
}
