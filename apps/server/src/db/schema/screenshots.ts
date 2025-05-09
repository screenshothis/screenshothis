import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";

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
	blockAds: boolean("block_ads").notNull().default(false),
	blockCookieBanners: boolean("block_cookie_banners").notNull().default(false),
	blockTrackers: boolean("block_trackers").notNull().default(false),
	blockRequests: jsonb("block_requests").$type<string[]>().default([]),
	blockResources: jsonb("block_resources").$type<string[]>().default([]),
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
