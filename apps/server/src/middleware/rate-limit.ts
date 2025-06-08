import { getSessionCookie } from "better-auth/cookies";
import { createMiddleware } from "hono/factory";

import { logger } from "#/lib/logger";
import { redis } from "#/lib/redis";

interface RateLimitOptions {
	limit: number;
	window: number;
	keyPrefix?: string;
}

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
		const resetTime = windowStart + window;
		const expirationSeconds = Math.ceil(window / 1000);

		try {
			// Use Redis pipeline for atomic operations
			const pipeline = redis.pipeline();

			// Get current count or 0 if key doesn't exist
			pipeline.get(windowKey);

			const results = await pipeline.exec();
			const currentCount = Number.parseInt(
				(results?.[0]?.[1] as string) || "0",
				10,
			);

			if (currentCount >= limit) {
				const resetIn = Math.ceil((resetTime - now) / 1000);
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

			// Increment counter and set expiration atomically
			const incrPipeline = redis.pipeline();
			incrPipeline.incr(windowKey);
			incrPipeline.expire(windowKey, expirationSeconds);

			const incrResults = await incrPipeline.exec();
			const newCount = (incrResults?.[0]?.[1] as number) || 1;

			c.res.headers.set("X-RateLimit-Limit", limit.toString());
			c.res.headers.set("X-RateLimit-Remaining", (limit - newCount).toString());
			c.res.headers.set(
				"X-RateLimit-Reset",
				Math.ceil((resetTime - now) / 1000).toString(),
			);

			return next();
		} catch (error) {
			// Fallback: if Redis is unavailable, allow the request but log the error
			logger.error(
				{ err: error, key: windowKey },
				"Redis rate limiting failed, allowing request",
			);

			// Set minimal headers to indicate Redis failure
			c.res.headers.set("X-RateLimit-Limit", limit.toString());
			c.res.headers.set("X-RateLimit-Remaining", limit.toString());
			c.res.headers.set("X-RateLimit-Reset", "60");

			return next();
		}
	});
};

// Redis handles key expiration automatically, no manual cleanup needed
