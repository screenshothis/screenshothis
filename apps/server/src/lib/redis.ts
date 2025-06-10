import { RedisClient } from "bun";

import { env } from "#/utils/env";

export const redis = new RedisClient(env.REDIS_URL);
