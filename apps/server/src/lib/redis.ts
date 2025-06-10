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

redis.on('connect', () => {
    console.log('🔌 Redis connected');
});

redis.on('ready', () => {
    console.log('✅ Redis client ready');
});

redis.on('error', (err) => {
    console.error('❌ Redis error:', err);
});

redis.on('end', () => {
    console.log('⚡ Redis connection closed');
});

redis.on('reconnecting', () => {
    console.log('🔄 Reconnecting to Redis...');
});
