import { relations } from "drizzle-orm/relations";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { newId } from "#/utils/generate-id";
import { users } from "./auth";
import { timestamps } from "./utils/timestamps";

export const workspaces = sqliteTable("workspaces", {
	id: text()
		.primaryKey()
		.$defaultFn(() => newId("workspace")),
	name: text().notNull(),
	isPersonal: integer({ mode: "boolean" }).notNull().default(false),
	ownerId: text()
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),
	...timestamps,
});

export const workspaceMembers = sqliteTable("workspace_members", {
	workspaceId: text()
		.notNull()
		.references(() => workspaces.id, {
			onDelete: "cascade",
		}),
	userId: text()
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),
	...timestamps,
});

export const workspaceInvitations = sqliteTable("workspace_invitations", {
	workspaceId: text()
		.notNull()
		.references(() => workspaces.id, {
			onDelete: "cascade",
		}),
	email: text().notNull(),
	...timestamps,
});

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
	owner: one(users, {
		fields: [workspaces.ownerId],
		references: [users.id],
	}),
	members: many(workspaceMembers),
	invitations: many(workspaceInvitations),
}));

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
