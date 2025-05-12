import { and, eq } from "drizzle-orm";

import { db } from "#/db";
import { workspaceMembers } from "#/db/schema/workspaces";

export async function getActiveWorkspace(userId: string) {
	const userMember = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.userId, userId),
			eq(workspaceMembers.role, "owner"),
		),
		with: {
			workspace: true,
		},
	});

	if (!userMember?.workspace) {
		throw new Error("No active organization found");
	}

	return userMember.workspace;
}
