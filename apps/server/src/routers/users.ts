import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { protectedProcedure } from "#/lib/orpc";

export const usersRouter = {
	me: protectedProcedure.handler(async ({ context }) => {
		const user = await db.query.users.findFirst({
			where: eq(schema.users.id, context.session?.user.id),
			with: {
				session: {
					with: {
						activeWorkspace: {
							columns: {
								id: true,
								name: true,
							},
							with: {
								accessToken: true,
							},
						},
					},
				},
			},
		});

		console.info(user);

		if (!user) {
			throw new ORPCError("User not found");
		}

		const userWorkspaces = await db
			.select({
				id: schema.workspaces.id,
				name: schema.workspaces.name,
			})
			.from(schema.workspaceMembers)
			.innerJoin(
				schema.workspaces,
				eq(schema.workspaceMembers.workspaceId, schema.workspaces.id),
			)
			.where(eq(schema.workspaceMembers.userId, user.id));

		return {
			fullName: user.name,
			email: user.email,
			imageUrl: user.imageUrl,
			currentWorkspace: {
				id: user.session.activeWorkspace?.id,
				name: user.session.activeWorkspace?.name,
				usage: {
					totalRequests: 0,
					remainingRequests: 0,
				},
				accessToken: {
					token: user.session.activeWorkspace?.accessToken?.token,
					redactedToken: "",
				},
			},
			workspaces: userWorkspaces,
		};
	}),
};
