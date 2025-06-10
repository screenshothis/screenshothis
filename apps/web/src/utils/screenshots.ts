import wildcardMatch from "wildcard-match";

export function isScreenshotAllowed(allowedOrigins: string[], url: string) {
	const targetUrl = new URL(url);
	const match = wildcardMatch(allowedOrigins, { separator: false });
	return (
		match(targetUrl.origin) ||
		match(targetUrl.hostname) ||
		allowedOrigins.some((pattern) => pattern === "*" || pattern === "**")
	);
}
