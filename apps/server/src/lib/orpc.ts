import { ORPCError } from "@orpc/client";
import { os } from "@orpc/server";

import type { Context } from "./context";
import { logger } from "./logger";

export const o = os.$context<Context>();

export const publicProcedure = o;

export const requireAuth = o.middleware(({ context, next }) => {
	if (!context.session) {
		logger.info("no session");

		throw new ORPCError("UNAUTHORIZED");
	}

	if (!context.session.user) {
		logger.info("no user");

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
