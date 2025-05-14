import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { protectedProcedure } from "#/lib/orpc";

export const usersRouter = {
	me: protectedProcedure.handler(async ({ context }) => {
		const user = await db.query.users.findFirst({
			where: eq(schema.users.id, context.session.user.id),
			with: {
				session: {
					with: {
						activeWorkspace: {
							columns: {
								id: true,
								name: true,
							},
						},
					},
				},
				apiKeys: {
					columns: {
						id: true,
					},
				},
				requestLimits: {
					columns: {
						totalRequests: true,
						totalAllowedRequests: true,
						remainingRequests: true,
					},
				},
			},
		});

		if (!user) {
			throw new ORPCError("User not found");
		}

		const userWorkspaces = await db
			.select({
				id: schema.workspace.id,
				name: schema.workspace.name,
			})
			.from(schema.workspaceMember)
			.innerJoin(
				schema.workspace,
				eq(schema.workspaceMember.workspaceId, schema.workspace.id),
			)
			.where(eq(schema.workspaceMember.userId, user.id));

		return {
			fullName: user.name,
			email: user.email,
			imageUrl: user.imageUrl,
			currentWorkspace: {
				id: user.session.activeWorkspace?.id,
				name: user.session.activeWorkspace?.name,
			},
			apiKeys: user.apiKeys,
			workspaces: userWorkspaces,
			requestLimits: user.requestLimits,
		};
	}),
};
