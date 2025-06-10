import { Redis } from "ioredis";

import { env } from "../utils/env";
import { logger } from "./logger";

export const redis = new Redis(env.REDIS_URL, {
	retryStrategy: (times: number) => {
		const delay = Math.min(2 ** times * 1000, 10000);
		logger.warn({ attempt: times, delay }, "redis connection retry");
		return delay;
	},
	connectTimeout: 5000,
	maxRetriesPerRequest: 3,
});

redis.on("connect", () => {
	logger.info("🔌 Redis connected");
});

redis.on("ready", () => {
	logger.info("✅ Redis client ready");
});

redis.on("error", (err) => {
	logger.error({ err }, "❌ Redis error");
});

redis.on("end", () => {
	logger.info("⚡ Redis connection closed");
});

redis.on("reconnecting", () => {
	logger.info("🔄 Reconnecting to Redis...");
});
