import { getAuth } from "@hono/clerk-auth";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext(ctx: CreateContextOptions) {
	const session = getAuth(ctx.context);
	return {
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
