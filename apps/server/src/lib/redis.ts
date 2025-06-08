import Redis from "ioredis";

import { env } from "#/utils/env";
import { logger } from "./logger";

export const redis = new Redis(env.REDIS_URL, {
	retryStrategy: (times: number) => {
		const delay = Math.min(2 ** times * 1000, 10000);
		logger.debug({ attempt: times, delay }, "Redis connection retry");
		return delay;
	},
	maxRetriesPerRequest: 3,
	lazyConnect: true,
});

redis.on("connect", () => {
	logger.info("Redis connected");
});

redis.on("error", (error: Error) => {
	logger.error({ err: error }, "Redis connection error");
});

redis.on("reconnecting", () => {
	logger.info("Redis reconnecting");
});
