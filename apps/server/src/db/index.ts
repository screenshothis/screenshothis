import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { logger } from "../lib/logger";
import * as schema from "./schema";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
	logger.error({ err }, "Database pool error");
});

export const db = drizzle(pool, {
	schema,
	casing: "snake_case",
});
