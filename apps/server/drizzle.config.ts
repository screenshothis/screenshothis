import { defineConfig } from "drizzle-kit";

import { env } from "#/utils/env";

export default defineConfig({
	schema: "./src/db/schema",
	out: "./src/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	casing: "snake_case",
});
