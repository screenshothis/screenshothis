import { ORPCError } from "@orpc/server";
import { CreateScreenshotSchema } from "@screenshothis/schemas/screenshots";
import { and, eq, like, sql } from "drizzle-orm";
import { objectToCamel } from "ts-case-convert";
import { z } from "zod";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { auth } from "#/lib/auth";
import { protectedProcedure } from "#/lib/orpc";
import { getOrCreateScreenshot } from "#/utils/screenshot";

export const screenshotsRouter = {
	create: protectedProcedure
		.input(CreateScreenshotSchema.transform((data) => objectToCamel(data)))
		.handler(async ({ context, input }) => {
			if (!context.session.activeWorkspaceId) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "Current workspace not found",
				});
			}

			try {
				await auth.api.verifyApiKey({
					body: {
						key: input.apiKey,
					},
				});
			} catch (error) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "Invalid API key",
				});
			}

			try {
				const { object, created } = await getOrCreateScreenshot(
					context.session.activeWorkspaceId,
					input,
				);

				if (!object) {
					throw new ORPCError("NOT_FOUND", {
						message: "Failed to get or create screenshot",
					});
				}

				if (created) {
					await db
						.update(schema.requestLimits)
						.set({
							totalRequests: sql`${schema.requestLimits.totalRequests} + 1`,
							remainingRequests: sql`${schema.requestLimits.remainingRequests} - 1`,
						})
						.where(eq(schema.requestLimits.userId, context.session.user.id));
				}

				const mimeFormat = input.format === "jpg" ? "jpeg" : input.format;

				return {
					image: `data:image/${mimeFormat};base64,${Buffer.from(object).toString("base64")}`,
				};
			} catch (error) {
				console.error("Failed to get screenshot", error);

				throw new ORPCError("BAD_REQUEST", {
					message: "Failed to get screenshot",
				});
			}
		}),
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
