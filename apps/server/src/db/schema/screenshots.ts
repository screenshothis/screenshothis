import type {
	FormatSchema,
	PrefersColorSchemeSchema,
	PrefersReducedMotionSchema,
	ResourceTypeSchema,
} from "@screenshothis/schemas/screenshots";
import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	real,
	text,
} from "drizzle-orm/pg-core";
import type { z } from "zod";

import { newId } from "#/utils/generate-id";
import { timestamps } from "./utils/timestamps";
import { workspaces } from "./workspaces";

export const screenshots = pgTable("screenshots", {
	id: text()
		.primaryKey()
		.$defaultFn(() => newId("screenshot")),
	url: text("url").notNull(),
	selector: text("selector"),
	width: integer("width").notNull(),
	height: integer("height").notNull(),
	isMobile: boolean("is_mobile").notNull().default(false),
	isLandscape: boolean("is_landscape").notNull().default(false),
	deviceScaleFactor: real("device_scale_factor").notNull().default(1),
	hasTouch: boolean("has_touch").notNull().default(false),
	format: text("format").$type<z.infer<typeof FormatSchema>>().notNull(),
	blockAds: boolean("block_ads").notNull().default(false),
	blockCookieBanners: boolean("block_cookie_banners").notNull().default(false),
	blockTrackers: boolean("block_trackers").notNull().default(false),
	blockRequests: jsonb("block_requests")
		.notNull()
		.$type<Array<string>>()
		.default([]),
	blockResources: jsonb("block_resources")
		.notNull()
		.$type<Array<z.infer<typeof ResourceTypeSchema>>>()
		.default([]),
	prefersColorScheme: text("prefers_color_scheme")
		.notNull()
		.$type<z.infer<typeof PrefersColorSchemeSchema>>()
		.default("light"),
	prefersReducedMotion: text("prefers_reduced_motion")
		.notNull()
		.$type<z.infer<typeof PrefersReducedMotionSchema>>()
		.default("no-preference"),
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
