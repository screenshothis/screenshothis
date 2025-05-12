import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

import { newId } from "#/utils/generate-id";
import { accessTokens } from "./access-tokens";
import { users } from "./auth";
import { polarCustomerState } from "./polar";
import { timestamps } from "./utils/timestamps";

export const workspaces = pgTable("workspaces", {
	id: text()
		.primaryKey()
		.$defaultFn(() => newId("workspace")),
	name: text("name").notNull(),
	isPersonal: boolean("is_personal").notNull().default(false),
	...timestamps,
});

export const workspaceMembers = pgTable("workspace_members", {
	workspaceId: text("workspace_id")
		.notNull()
		.references(() => workspaces.id, {
			onDelete: "cascade",
		}),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),
	...timestamps,
});

export const workspaceInvitations = pgTable("workspace_invitations", {
	email: text("email").notNull(),
	workspaceId: text("workspace_id")
		.notNull()
		.references(() => workspaces.id, {
			onDelete: "cascade",
		}),
	...timestamps,
});

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
	members: many(workspaceMembers),
	invitations: many(workspaceInvitations),
	accessToken: one(accessTokens, {
		fields: [workspaces.id],
		references: [accessTokens.workspaceId],
	}),
	polarCustomerState: one(polarCustomerState, {
		fields: [workspaces.id],
		references: [polarCustomerState.externalId],
	}),
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
