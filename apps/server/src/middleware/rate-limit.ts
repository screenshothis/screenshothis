import { getSessionCookie } from "better-auth/cookies";
import { createMiddleware } from "hono/factory";

interface RateLimitOptions {
	limit: number;
	window: number;
	keyPrefix?: string;
}

const store = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (options: RateLimitOptions) => {
	return createMiddleware(async (c, next) => {
		const { limit, window, keyPrefix = "rate_limit" } = options;

		const sessionCookie = getSessionCookie(c.req.raw);
		const key = sessionCookie
			? `${keyPrefix}:user:${sessionCookie}`
			: `${keyPrefix}:ip:${c.req.header("x-forwarded-for") || "unknown"}`;

		const now = Date.now();
		const windowStart = Math.floor(now / window) * window;
		const windowKey = `${key}:${windowStart}`;

		const current = store.get(windowKey) || {
			count: 0,
			resetTime: windowStart + window,
		};

		if (now > current.resetTime) {
			store.delete(windowKey);
			current.count = 0;
			current.resetTime = windowStart + window;
		}

		if (current.count >= limit) {
			const resetIn = Math.ceil((current.resetTime - now) / 1000);
			c.res.headers.set("X-RateLimit-Limit", limit.toString());
			c.res.headers.set("X-RateLimit-Remaining", "0");
			c.res.headers.set("X-RateLimit-Reset", resetIn.toString());

			return c.json(
				{
					error: "Rate limit exceeded",
					resetIn,
				},
				429,
			);
		}

		current.count++;
		store.set(windowKey, current);

		c.res.headers.set("X-RateLimit-Limit", limit.toString());
		c.res.headers.set(
			"X-RateLimit-Remaining",
			(limit - current.count).toString(),
		);
		c.res.headers.set(
			"X-RateLimit-Reset",
			Math.ceil((current.resetTime - now) / 1000).toString(),
		);

		return next();
	});
};

setInterval(() => {
	const now = Date.now();
	for (const [key, value] of store.entries()) {
		if (now > value.resetTime) {
			store.delete(key);
		}
	}
}, 60000);
