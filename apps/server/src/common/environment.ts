import type { UnkeyContext } from "@unkey/hono";

export type Environment = {
	CORS_ORIGIN: string;
	CLERK_PUBLISHABLE_KEY: string;
	CLERK_SECRET_KEY: string;
	CLERK_WEBHOOK_SIGNING_SECRET: string;
};

export type Variables = {
	workspaceId: string;
	unkey: UnkeyContext;
};
