import { ORPCError } from "@orpc/server";
import { UpdateWorkspaceSchema } from "@screenshothis/schemas/workspaces";
import { and, eq } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { protectedProcedure } from "#/lib/orpc";

export const workspacesRouter = {
	update: protectedProcedure
		.input(UpdateWorkspaceSchema)
		.handler(async ({ input, context }) => {
			const { id, name } = input;

			try {
				const workspaceMember = await db.query.workspaceMember.findFirst({
					where: and(
						eq(schema.workspaceMember.workspaceId, id),
						eq(schema.workspaceMember.userId, context.session.userId),
						eq(schema.workspaceMember.role, "owner"),
					),
				});

				if (!workspaceMember) {
					throw new ORPCError("UNAUTHORIZED", {
						message: "You are not the owner of this workspace",
					});
				}

				const workspace = await db
					.update(schema.workspace)
					.set({
						name,
					})
					.where(eq(schema.workspace.id, id))
					.returning();

				if (workspace.length === 0) {
					throw new ORPCError("NOT_FOUND", {
						message: `Workspace with id ${id} not found`,
					});
				}

				return workspace;
			} catch (error) {
				console.error("Failed to update workspace:", error);

				if (error instanceof ORPCError) {
					throw error;
				}

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to update workspace",
				});
			}
		}),
};
