import { getAuth } from "@hono/clerk-auth";
import type { Context as HonoContext } from "hono";

import type { Variables } from "#/common/environment";

export type CreateContextOptions = {
	context: HonoContext<{ Variables: Variables }>;
};

export async function createContext(ctx: CreateContextOptions) {
	const session = getAuth(ctx.context);

	return {
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
