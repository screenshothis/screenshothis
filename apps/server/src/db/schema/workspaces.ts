import { generateId } from "@screenshothis/id";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

import { users } from "./auth";
import { polarCustomerState } from "./polar";
import { timestamps } from "./utils/timestamps";

export const workspace = pgTable("workspaces", {
	id: text()
		.primaryKey()
		.$defaultFn(() => generateId("workspace")),
	name: text("name").notNull(),
	slug: text("slug").unique(),
	logoUrl: text("logo_url"),
	metadata: text("metadata"),
	...timestamps,
});

export const workspaceMember = pgTable("workspace_members", {
	id: text()
		.primaryKey()
		.$defaultFn(() => generateId("workspaceMember")),
	workspaceId: text("workspace_id")
		.notNull()
		.references(() => workspace.id, {
			onDelete: "cascade",
		}),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),
	role: text("role").notNull(),
	...timestamps,
});

export const workspaceInvitation = pgTable("workspace_invitations", {
	id: text()
		.primaryKey()
		.$defaultFn(() => generateId("workspaceInvitation")),
	email: text("email").notNull(),
	role: text("role"),
	status: text("status").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	inviterId: text("inviter_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),
	workspaceId: text("workspace_id")
		.notNull()
		.references(() => workspace.id, {
			onDelete: "cascade",
		}),
	...timestamps,
});

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
	members: many(workspaceMember),
	invitations: many(workspaceInvitation),
	polarCustomerState: one(polarCustomerState, {
		fields: [workspace.id],
		references: [polarCustomerState.externalId],
	}),
}));

export const workspaceMembersRelations = relations(
	workspaceMember,
	({ one }) => ({
		workspace: one(workspace, {
			fields: [workspaceMember.workspaceId],
			references: [workspace.id],
		}),
		user: one(users, {
			fields: [workspaceMember.userId],
			references: [users.id],
		}),
	}),
);

export const workspaceInvitationsRelations = relations(
	workspaceInvitation,
	({ one }) => ({
		workspace: one(workspace, {
			fields: [workspaceInvitation.workspaceId],
			references: [workspace.id],
		}),
		inviter: one(users, {
			fields: [workspaceInvitation.inviterId],
			references: [users.id],
		}),
	}),
);
