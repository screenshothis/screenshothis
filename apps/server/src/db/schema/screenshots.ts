import { generateId } from "@screenshothis/id";
import type {
	FormatSchema,
	PrefersColorSchemeSchema,
	PrefersReducedMotionSchema,
	ResourceTypeSchema,
} from "@screenshothis/schemas/screenshots";
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	real,
	text,
} from "drizzle-orm/pg-core";
import type { z } from "zod";

import type { CookieSameSite } from "puppeteer";
import { timestamps } from "./utils/timestamps";
import { workspace } from "./workspaces";

export const screenshots = pgTable(
	"screenshots",
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => generateId("screenshot")),
		url: text("url").notNull(),
		selector: text("selector"),
		width: integer("width").notNull(),
		height: integer("height").notNull(),
		isMobile: boolean("is_mobile").notNull().default(false),
		isLandscape: boolean("is_landscape").notNull().default(false),
		deviceScaleFactor: real("device_scale_factor").notNull().default(1),
		duration: real("duration").notNull().default(0),
		hasTouch: boolean("has_touch").notNull().default(false),
		format: text("format").$type<z.infer<typeof FormatSchema>>().notNull(),
		quality: integer("quality").notNull().default(80),
		blockAds: boolean("block_ads").notNull().default(false),
		blockCookieBanners: boolean("block_cookie_banners")
			.notNull()
			.default(false),
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
		isCached: boolean("is_cached").notNull().default(false),
		cacheTtl: integer("cache_ttl").default(3600),
		cacheKey: text("cache_key"),
		userAgent: text("user_agent"),
		headers: jsonb("headers")
			.notNull()
			.$type<Array<{ name: string; value: string }>>()
			.default([]),
		cookies: jsonb("cookies")
			.notNull()
			.$type<
				Array<{
					name: string;
					value: string;
					domain?: string;
					path?: string;
					expires?: number;
					sameSite?: CookieSameSite | undefined;
					secure?: boolean;
					httpOnly?: boolean;
				}>
			>()
			.default([]),
		bypassCsp: boolean("bypass_csp").notNull().default(false),
		isExtra: boolean("is_extra").notNull().default(false),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspace.id, {
				onDelete: "cascade",
			}),
		...timestamps,
	},
	(table) => [
		index("screenshots_created_at_idx").on(table.createdAt.desc()),
		index("screenshots_url_idx").on(table.url),
	],
);

export const screenshotsRelations = relations(screenshots, ({ one }) => ({
	workspace: one(workspace, {
		fields: [screenshots.workspaceId],
		references: [workspace.id],
	}),
}));
