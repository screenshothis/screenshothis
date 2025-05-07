import { eq } from "drizzle-orm";

import { db } from "#/db";
import { users, workspaceMembers, workspaces } from "#/db/schema";
import { unkey } from "#/lib/unkey";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	me: protectedProcedure.query(async ({ ctx }) => {
		const user = await db.query.users.findFirst({
			where: eq(users.externalId, ctx.session.userId),
			with: {
				currentWorkspace: {
					columns: {
						id: true,
						name: true,
					},
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
			throw new Error("Access token not found for current workspace");
		}

		const { result } = await unkey.keys.get({
			keyId: user.currentWorkspace.accessToken.externalId,
		});

		if (!result) {
			throw new Error("Access token not found");
		}

		const userWorkspaces = await db
			.select({
				id: workspaces.id,
				name: workspaces.name,
			})
			.from(workspaceMembers)
			.innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
			.where(eq(workspaceMembers.userId, user.id));

		return {
			user: {
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
			},
			currentWorkspace: {
				id: user.currentWorkspace.id,
				name: user.currentWorkspace.name,
				usage: {
					totalRequests: result.refill?.amount,
					remainingRequests: result.remaining,
				},
			},
			// For some reason I needed to add this for trpc type inference
			workspaces: userWorkspaces as {
				id: string;
				name: string;
			}[],
		};
	}),
});
export type AppRouter = typeof appRouter;
