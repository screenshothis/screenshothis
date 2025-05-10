import { eq } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { protectedProcedure } from "#/lib/orpc";
import { unkey } from "#/lib/unkey";

export const usersRouter = {
	me: protectedProcedure.handler(async ({ context }) => {
		const user = await db.query.users.findFirst({
			where: eq(schema.users.externalId, context.session.userId),
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
			fullName: `${user.firstName} ${user.lastName}`,
			email: user.email,
			imageUrl: user.imageUrl,
			currentWorkspace: {
				id: user.currentWorkspace.id,
				name: user.currentWorkspace.name,
				usage: {
					totalRequests: result.refill?.amount,
					remainingRequests: result.remaining,
				},
				accessToken: {
					token: user.currentWorkspace.accessToken.token,
					redactedToken: Array.from(user.currentWorkspace.accessToken.token)
						.map((_, i) =>
							i > 2 ? "•" : user.currentWorkspace?.accessToken.token[i],
						)
						.join(""),
				},
			},
			workspaces: userWorkspaces,
		};
	}),
};
