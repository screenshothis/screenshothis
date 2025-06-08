import { getSessionCookie } from "better-auth/cookies";
import { createMiddleware } from "hono/factory";

import { logger } from "#/lib/logger";
import { redis } from "#/lib/redis";

interface RateLimitOptions {
	limit: number;
	window: number;
	keyPrefix?: string;
}

function getClientIdentifier(request: Request): string {
	const forwardedFor = request.headers.get("x-forwarded-for");
	const realIp = request.headers.get("x-real-ip");
	const cfConnectingIp = request.headers.get("cf-connecting-ip");

	if (cfConnectingIp) {
		return cfConnectingIp.trim();
	}

	if (realIp) {
		return realIp.trim();
	}

	if (forwardedFor) {
		const firstIp = forwardedFor.split(",")[0]?.trim();
		if (firstIp && isValidIp(firstIp)) {
			return firstIp;
		}
	}

	const userAgent = request.headers.get("user-agent") || "";
	const acceptLang = request.headers.get("accept-language") || "";
	const acceptEnc = request.headers.get("accept-encoding") || "";

	const fingerprint = `${userAgent}-${acceptLang}-${acceptEnc}`;
	return `fallback-${Bun.hash(fingerprint).toString(16)}`;
}

function isValidIp(ip: string): boolean {
	const ipv4Regex =
		/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

	return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export const rateLimitMiddleware = (options: RateLimitOptions) => {
	return createMiddleware(async (c, next) => {
		const { limit, window, keyPrefix = "rate_limit" } = options;

		const sessionCookie = getSessionCookie(c.req.raw);
		const key = sessionCookie
			? `${keyPrefix}:user:${sessionCookie}`
			: `${keyPrefix}:ip:${getClientIdentifier(c.req.raw)}`;

		const now = Date.now();
		const windowStart = Math.floor(now / window) * window;
		const windowKey = `${key}:${windowStart}`;
		const resetTime = windowStart + window;
		const expirationSeconds = Math.ceil(window / 1000);

		try {
			const pipeline = redis.pipeline();

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
			logger.error(
				{ err: error, key: windowKey },
				"Redis rate limiting failed, allowing request",
			);

			c.res.headers.set("X-RateLimit-Limit", limit.toString());
			c.res.headers.set("X-RateLimit-Remaining", limit.toString());
			c.res.headers.set("X-RateLimit-Reset", "60");

			return next();
		}
	});
};
