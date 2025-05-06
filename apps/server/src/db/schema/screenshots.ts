import { relations } from "drizzle-orm";
import { integer, pgTable, text } from "drizzle-orm/pg-core";

import { newId } from "#/utils/generate-id";
import { timestamps } from "./utils/timestamps";
import { workspaces } from "./workspaces";

export const screenshots = pgTable("screenshots", {
	id: text()
		.primaryKey()
		.$defaultFn(() => newId("screenshot")),
	url: text().notNull(),
	width: integer().notNull(),
	height: integer().notNull(),
	format: text().$type<"jpg" | "png" | "webp">().notNull(),
	workspaceId: text()
		.notNull()
		.references(() => workspaces.id, {
			onDelete: "cascade",
		}),
	...timestamps,
});

export const screenshotsRelations = relations(screenshots, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [screenshots.workspaceId],
		references: [workspaces.id],
	}),
}));
