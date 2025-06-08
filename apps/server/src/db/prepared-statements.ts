import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "./index";
import { users } from "./schema/auth";
import { screenshots } from "./schema/screenshots";
import { workspace, workspaceMember } from "./schema/workspaces";

export const getScreenshotByIdPrepared = db
	.select()
	.from(screenshots)
	.where(eq(screenshots.id, sql.placeholder("id")))
	.prepare("getScreenshotById");

export const getScreenshotsByCacheKeyPrepared = db
	.select()
	.from(screenshots)
	.where(eq(screenshots.cacheKey, sql.placeholder("cacheKey")))
	.prepare("getScreenshotsByCacheKey");

export const getScreenshotsByWorkspaceIdPrepared = db
	.select()
	.from(screenshots)
	.where(
		and(
			eq(screenshots.workspaceId, sql.placeholder("workspaceId")),
			eq(screenshots.isCached, sql.placeholder("isCached")),
		),
	)
	.orderBy(desc(screenshots.createdAt))
	.limit(sql.placeholder("limit"))
	.prepare("getScreenshotsByWorkspaceId");

export const getRecentScreenshotsPrepared = db
	.select()
	.from(screenshots)
	.where(eq(screenshots.workspaceId, sql.placeholder("workspaceId")))
	.orderBy(desc(screenshots.createdAt))
	.limit(sql.placeholder("limit"))
	.prepare("getRecentScreenshots");

export const insertScreenshotPrepared = db
	.insert(screenshots)
	.values({
		id: sql.placeholder("id"),
		url: sql.placeholder("url"),
		selector: sql.placeholder("selector"),
		width: sql.placeholder("width"),
		height: sql.placeholder("height"),
		isMobile: sql.placeholder("isMobile"),
		isLandscape: sql.placeholder("isLandscape"),
		deviceScaleFactor: sql.placeholder("deviceScaleFactor"),
		duration: sql.placeholder("duration"),
		hasTouch: sql.placeholder("hasTouch"),
		format: sql.placeholder("format"),
		quality: sql.placeholder("quality"),
		blockAds: sql.placeholder("blockAds"),
		blockCookieBanners: sql.placeholder("blockCookieBanners"),
		blockTrackers: sql.placeholder("blockTrackers"),
		blockRequests: sql.placeholder("blockRequests"),
		blockResources: sql.placeholder("blockResources"),
		prefersColorScheme: sql.placeholder("prefersColorScheme"),
		prefersReducedMotion: sql.placeholder("prefersReducedMotion"),
		isCached: sql.placeholder("isCached"),
		cacheTtl: sql.placeholder("cacheTtl"),
		cacheKey: sql.placeholder("cacheKey"),
		userAgent: sql.placeholder("userAgent"),
		headers: sql.placeholder("headers"),
		cookies: sql.placeholder("cookies"),
		bypassCsp: sql.placeholder("bypassCsp"),
		isExtra: sql.placeholder("isExtra"),
		workspaceId: sql.placeholder("workspaceId"),
	})
	.returning()
	.prepare("insertScreenshot");

export const updateScreenshotStatusPrepared = db
	.update(screenshots)
	.set({
		isCached: true,
		updatedAt: sql`NOW()`,
	})
	.where(eq(screenshots.id, sql.placeholder("id")))
	.returning()
	.prepare("updateScreenshotStatus");

export const getUserByIdPrepared = db
	.select()
	.from(users)
	.where(eq(users.id, sql.placeholder("id")))
	.prepare("getUserById");

export const getWorkspaceByIdPrepared = db
	.select()
	.from(workspace)
	.where(eq(workspace.id, sql.placeholder("id")))
	.prepare("getWorkspaceById");

export const getUserWorkspacesPrepared = db
	.select({
		workspace: workspace,
		role: workspaceMember.role,
	})
	.from(workspace)
	.innerJoin(workspaceMember, eq(workspace.id, workspaceMember.workspaceId))
	.where(eq(workspaceMember.userId, sql.placeholder("userId")))
	.orderBy(desc(workspace.createdAt))
	.prepare("getUserWorkspaces");

export const getScreenshotCountByWorkspacePrepared = db
	.select({ count: sql<number>`count(*)` })
	.from(screenshots)
	.where(eq(screenshots.workspaceId, sql.placeholder("workspaceId")))
	.prepare("getScreenshotCountByWorkspace");

export const getScreenshotsByDateRangePrepared = db
	.select()
	.from(screenshots)
	.where(
		and(
			eq(screenshots.workspaceId, sql.placeholder("workspaceId")),
			gte(screenshots.createdAt, sql.placeholder("startDate")),
			lte(screenshots.createdAt, sql.placeholder("endDate")),
		),
	)
	.orderBy(desc(screenshots.createdAt))
	.prepare("getScreenshotsByDateRange");
