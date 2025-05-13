import { and, eq } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";

export async function getActiveWorkspace(userId: string) {
	const userMember = await db.query.workspaceMember.findFirst({
		where: and(
			eq(schema.workspaceMember.userId, userId),
			eq(schema.workspaceMember.role, "owner"),
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
