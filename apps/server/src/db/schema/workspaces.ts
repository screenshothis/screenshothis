import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

import { newId } from "#/utils/generate-id";
import { users } from "./auth.ts";
import { timestamps } from "./utils/timestamps.ts";

export const workspaces = pgTable("workspaces", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => newId("workspace")),
	name: text("name").notNull(),
	isPersonal: boolean("is_personal").notNull().default(false),
	...timestamps,
});

export const workspaceMembers = pgTable("workspace_members", {
	workspaceId: text("workspace_id")
		.notNull()
		.references(() => workspaces.id),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	...timestamps,
});

export const workspaceInvitations = pgTable("workspace_invitations", {
	workspaceId: text("workspace_id")
		.notNull()
		.references(() => workspaces.id),
	email: text("email").notNull(),
	...timestamps,
});

export const workspaceInvitationsRelations = relations(
	workspaceInvitations,
	({ one }) => ({
		workspace: one(workspaces, {
			fields: [workspaceInvitations.workspaceId],
			references: [workspaces.id],
		}),
	}),
);

export const workspaceMembersRelations = relations(
	workspaceMembers,
	({ one }) => ({
		workspace: one(workspaces, {
			fields: [workspaceMembers.workspaceId],
			references: [workspaces.id],
		}),
	}),
);
