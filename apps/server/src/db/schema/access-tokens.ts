import { relations, sql } from "drizzle-orm";
import { integer, pgTable, text } from "drizzle-orm/pg-core";

import { newId } from "#/utils/generate-id";
import { timestamps } from "./utils/timestamps";
import { workspaces } from "./workspaces";

export const accessTokens = pgTable("access_tokens", {
	id: text()
		.primaryKey()
		.$defaultFn(() => newId("accessToken")),
	token: text().notNull().unique(),
	externalId: text("external_id").notNull().unique(),
	workspaceId: text("workspace_id").notNull(),
	lastUsedAt: integer("last_used_at")
		.notNull()
		.default(sql`extract(epoch from now())`),
	...timestamps,
});

export const accessTokensRelations = relations(accessTokens, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [accessTokens.workspaceId],
		references: [workspaces.id],
	}),
}));
