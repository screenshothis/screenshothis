import { ORPCError } from "@orpc/server";
import { and, eq, like } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db";
import * as schema from "../db/schema";
import { protectedProcedure } from "../lib/orpc";

export const screenshotsRouter = {
	list: protectedProcedure
		.input(
			z
				.object({
					q: z.string().optional(),
				})
				.optional(),
		)
		.handler(async ({ context, input }) => {
			if (!context.session.activeWorkspaceId) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "Current workspace not found",
				});
			}

			const screenshots = await db.query.screenshots.findMany({
				where: and(
					eq(schema.screenshots.workspaceId, context.session.activeWorkspaceId),
					input?.q ? like(schema.screenshots.url, `%${input.q}%`) : undefined,
				),
				columns: {
					id: true,
					url: true,
					selector: true,
					width: true,
					height: true,
					isMobile: true,
					isLandscape: true,
					deviceScaleFactor: true,
					hasTouch: true,
					format: true,
					blockAds: true,
					blockCookieBanners: true,
					blockTrackers: true,
					blockRequests: true,
					blockResources: true,
					prefersColorScheme: true,
					prefersReducedMotion: true,
					duration: true,
					isCached: true,
					cacheTtl: true,
					cacheKey: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			return screenshots;
		}),
	get: protectedProcedure
		.input(
			z.object({
				id: z.string({ required_error: "Screenshot id is required" }),
			}),
		)
		.handler(async ({ context, input }) => {
			if (!context.session.activeWorkspaceId) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "Current workspace not found",
				});
			}

			const screenshot = await db.query.screenshots.findFirst({
				where: and(
					eq(schema.screenshots.id, input.id),
					eq(schema.screenshots.workspaceId, context.session.activeWorkspaceId),
				),
			});

			if (!screenshot) {
				throw new ORPCError("NOT_FOUND", {
					message: "Screenshot not found",
				});
			}

			return screenshot;
		}),
};
