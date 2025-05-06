import { relations, sql } from "drizzle-orm";
import { integer, pgTable, text } from "drizzle-orm/pg-core";

import { timestamps } from "./utils/timestamps";
import { workspaces } from "./workspaces";

export const accessTokens = pgTable("access_tokens", {
	id: text().primaryKey(),
	name: text().notNull(),
	token: text().notNull().unique(),
	workspaceId: text().notNull(),
	lastUsedAt: integer().notNull().default(sql`extract(epoch from now())`),
	expiresAt: integer().notNull(),
	...timestamps,
});

export const accessTokensRelations = relations(accessTokens, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [accessTokens.workspaceId],
		references: [workspaces.id],
	}),
}));
