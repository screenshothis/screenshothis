import { pgTable, text } from "drizzle-orm/pg-core";

import { newId } from "#/utils/generate-id";
import { relations } from "drizzle-orm";
import { timestamps } from "./utils/timestamps";
import { workspaces } from "./workspaces";

export const users = pgTable("users", {
	id: text()
		.primaryKey()
		.$defaultFn(() => newId("user")),
	externalId: text().unique().notNull(),
	username: text(),
	firstName: text(),
	lastName: text(),
	imageUrl: text().notNull(),
	email: text().unique().notNull(),
	...timestamps,
});

export const userRelations = relations(users, ({ many }) => ({
	workspaces: many(workspaces),
}));
