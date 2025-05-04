import type { Env } from "hono";

type Environment = Env & {
	Bindings: {
		DB: D1Database;
		CLERK_PUBLISHABLE_KEY: string;
		CLERK_SECRET_KEY: string;
		CLERK_WEBHOOK_SIGNING_SECRET: string;
	};
};
