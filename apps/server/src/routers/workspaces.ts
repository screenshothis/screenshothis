import { ORPCError } from "@orpc/server";
import { UpdateWorkspaceSchema } from "@screenshothis/schemas/workspaces";
import { eq } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { protectedProcedure } from "#/lib/orpc";

export const workspacesRouter = {
	update: protectedProcedure
		.input(UpdateWorkspaceSchema)
		.handler(async ({ input }) => {
			const { id, name } = input;

			try {
				const workspace = await db
					.update(schema.workspace)
					.set({
						name,
					})
					.where(eq(schema.workspace.id, id))
					.returning();

				if (workspace.length === 0) {
					throw new ORPCError(`Workspace with id ${id} not found`);
				}

				return workspace;
			} catch (error) {
				console.error("Failed to update workspace:", error);

				throw new ORPCError("Failed to update workspace");
			}
		}),
};
