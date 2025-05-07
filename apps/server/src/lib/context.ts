import { getAuth } from "@hono/clerk-auth";
import { eq } from "drizzle-orm";
import type { Context as HonoContext } from "hono";

import type { Variables } from "#/common/environment";
import { db } from "#/db";
import { users } from "#/db/schema";

export type CreateContextOptions = {
	context: HonoContext<{ Variables: Variables }>;
};

export async function createContext(ctx: CreateContextOptions) {
	const session = getAuth(ctx.context);
	const user = session?.userId
		? await db.query.users.findFirst({
				where: eq(users.externalId, session.userId),
				columns: {
					currentWorkspaceId: true,
				},
			})
		: null;

	return {
		session,
		user,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
