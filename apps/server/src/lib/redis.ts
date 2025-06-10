import { RedisClient } from "bun";

import { env } from "#/utils/env";

export const redis = new RedisClient(env.REDIS_URL, {
	connectionTimeout: 5000,
	idleTimeout: 300000,
	maxRetries: 5,
});
