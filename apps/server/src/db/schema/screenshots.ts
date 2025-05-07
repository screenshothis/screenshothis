import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, text } from "drizzle-orm/pg-core";

import { newId } from "#/utils/generate-id";
import { timestamps } from "./utils/timestamps";
import { workspaces } from "./workspaces";

export const screenshots = pgTable("screenshots", {
	id: text()
		.primaryKey()
		.$defaultFn(() => newId("screenshot")),
	url: text().notNull(),
	width: integer("width").notNull(),
	height: integer("height").notNull(),
	format: text("format").$type<"jpeg" | "png" | "webp">().notNull(),
	isExtra: boolean("is_extra").notNull().default(false),
	workspaceId: text("workspace_id")
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
