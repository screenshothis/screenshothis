import type { UnkeyContext } from "@unkey/hono";

export type Environment = {
	CORS_ORIGIN: string;
};

export type Variables = {
	workspaceId: string;
	unkey: UnkeyContext;
};
