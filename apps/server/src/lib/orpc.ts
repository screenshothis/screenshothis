import { ORPCError } from "@orpc/client";
import { os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

export const requireAuth = o.middleware(({ context, next }) => {
	if (!context.session?.sessionId) {
		throw new ORPCError("UNAUTHORIZED", {
			message: "Authentication required",
			cause: "No session",
		});
	}

	return next({
		context: {
			...context,
			session: context.session,
		},
	});
});

export const protectedProcedure = publicProcedure.use(requireAuth);
