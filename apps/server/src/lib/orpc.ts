import { ORPCError } from "@orpc/client";
import { os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

export const requireAuth = o.middleware(({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}

	return next({
		context: {
			...context,
			session: context.session,
		},
	});
});

export const protectedProcedure = publicProcedure.use(requireAuth);
