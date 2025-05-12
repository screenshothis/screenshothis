import type { Context as HonoContext } from "hono";

import type { Variables } from "../common/environment";
import { auth } from "./auth.js";

export type CreateContextOptions = {
	context: HonoContext<{ Variables: Variables }>;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
