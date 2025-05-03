import { defineMiddleware, setResponseHeaders } from "vinxi/http";

export default defineMiddleware({
	onBeforeResponse: (event) => {
		setResponseHeaders(event, {
			"X-Frame-Options": "DENY",
			"X-Content-Type-Options": "nosniff",
			"Referrer-Policy": "strict-origin-when-cross-origin",
			"Permissions-Policy": "geolocation=(), camera=(), microphone=()",
			"Content-Security-Policy":
				"default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
		});
	},
});
