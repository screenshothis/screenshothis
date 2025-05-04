import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "hono";

type Environment = Env & {
	Bindings: {
		DB: D1Database;
		CORS_ORIGIN: string;
		CLERK_PUBLISHABLE_KEY: string;
		CLERK_SECRET_KEY: string;
		CLERK_WEBHOOK_SIGNING_SECRET: string;
	};
};
