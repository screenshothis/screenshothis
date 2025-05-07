import { eq } from "drizzle-orm";

import { db } from "#/db";
import { users } from "#/db/schema";
import { unkey } from "#/lib/unkey";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.userId,
		};
	}),
	me: protectedProcedure.query(async ({ ctx }) => {
		const user = await db.query.users.findFirst({
			where: eq(users.id, ctx.session.userId),
			with: {
				currentWorkspace: {
					with: {
						accessToken: {
							columns: {
								externalId: true,
								token: true,
							},
						},
					},
				},
			},
		});

		if (!user) {
			throw new Error("User not found");
		}

		if (!user.currentWorkspace?.accessToken) {
			throw new Error("Access token not found");
		}

		const { result } = await unkey.keys.get({
			keyId: user.currentWorkspace.accessToken.externalId,
		});

		if (!result) {
			throw new Error("Access token not found");
		}

		return {
			user: {
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
			},
			workspace: {
				usage: {
					totalRequests: result.refill?.amount,
					remainingRequests: result.remaining,
				},
			},
		};
	}),
});
export type AppRouter = typeof appRouter;
