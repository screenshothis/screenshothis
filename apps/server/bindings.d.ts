import type { D1Database, Queue } from "@cloudflare/workers-types";
import type { Env } from "hono";

type Environment = Env & {
	Bindings: {
		DB: D1Database;
		SCREENSHOT_QUEUE: Queue<{
			url: string;
			width: number;
			height: number;
			format: string;
			workspaceId: string;
			jobId: string;
		}>;
		CORS_ORIGIN: string;
		CLOUDFLARE_ACCOUNT_ID: string;
		CLOUDFLARE_API_TOKEN: string;
		CLERK_PUBLISHABLE_KEY: string;
		CLERK_SECRET_KEY: string;
		CLERK_WEBHOOK_SIGNING_SECRET: string;
	};
};
