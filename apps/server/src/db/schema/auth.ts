import { relations } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";

import { newId } from "#/utils/generate-id";
import { timestamps } from "./utils/timestamps";
import { workspaces } from "./workspaces";

export const users = pgTable("users", {
	id: text()
		.primaryKey()
		.$defaultFn(() => newId("user")),
	externalId: text("external_id").unique().notNull(),
	username: text("username"),
	firstName: text("first_name"),
	lastName: text("last_name"),
	imageUrl: text("image_url").notNull(),
	email: text("email").unique().notNull(),
	currentWorkspaceId: text("current_workspace_id").references(
		() => workspaces.id,
		{
			onDelete: "set null",
		},
	),
	...timestamps,
});

export const userRelations = relations(users, ({ many, one }) => ({
	currentWorkspace: one(workspaces, {
		fields: [users.currentWorkspaceId],
		references: [workspaces.id],
	}),
	workspaces: many(workspaces),
}));
