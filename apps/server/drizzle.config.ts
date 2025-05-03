import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema",
	out: "./src/db/migrations",
	dialect: "sqlite",
	driver: "d1-http",
	dbCredentials: {
		accountId: process.env.CF_ACCOUNT_ID || "",
		databaseId: process.env.CF_DATABASE_ID || "",
		token: process.env.CF_API_TOKEN || "",
	},
	casing: "snake_case",
});
