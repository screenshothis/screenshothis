import type { Context as HonoContext } from "hono";

import type { Variables } from "../common/environment";
import { auth } from "./auth";

export type CreateContextOptions = {
	context: HonoContext<{ Variables: Variables }>;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession(context.req.raw);

	if (!session) {
		return {
			session: null,
			user: null,
		};
	}

	return {
		session: {
			...session?.session,
			user: session?.user,
		},
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
