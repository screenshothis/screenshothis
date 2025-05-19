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

			const workspace = await db
				.update(schema.workspace)
				.set({
					name,
				})
				.where(eq(schema.workspace.id, id))
				.returning();

			return workspace;
		}),
};
