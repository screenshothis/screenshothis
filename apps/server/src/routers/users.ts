import { ORPCError } from "@orpc/server";
import { UpdateUserSchema } from "@screenshothis/schemas/users";
import { eq } from "drizzle-orm";

import { checkExistingEmail } from "#/actions/check-existing-email";
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
						plan: true,
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
	update: protectedProcedure
		.input(UpdateUserSchema)
		.handler(async ({ context, input }) => {
			const existingUser = await checkExistingEmail(
				input.email,
				context.session.user.id,
			);

			if (existingUser) {
				throw new ORPCError("Email already in use by another account");
			}

			const user = await db
				.update(schema.users)
				.set({
					name: input.name,
					email: input.email,
				})
				.where(eq(schema.users.id, context.session.user.id))
				.returning({
					id: schema.users.id,
				});

			return user;
		}),
};
