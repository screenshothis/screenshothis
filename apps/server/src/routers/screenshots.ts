import { ORPCError } from "@orpc/server";
import { CreateScreenshotSchema } from "@screenshothis/schemas/screenshots";
import { and, eq, like } from "drizzle-orm";
import { objectToCamel } from "ts-case-convert";
import { z } from "zod";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { auth } from "#/lib/auth";
import { logger } from "#/lib/logger";
import { protectedProcedure } from "#/lib/orpc";
import {
	RequestQuotaError,
	assertQuotaAvailable,
	consumeQuota,
} from "#/lib/request-quota";
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
				// Ensure the user still has quota before attempting to generate a screenshot
				try {
					await assertQuotaAvailable(context.session.user.id);
				} catch (error) {
					if (error instanceof RequestQuotaError) {
						throw new ORPCError("FORBIDDEN", {
							message:
								error.type === "EXCEEDED"
									? "You have reached the maximum number of requests allowed for your current plan."
									: "Request limits not found for the current user",
						});
					}
					throw error;
				}

				const { object, created } = await getOrCreateScreenshot(
					context.session.activeWorkspaceId,
					input,
				);

				if (!object) {
					throw new ORPCError("NOT_FOUND", {
						message: "Failed to get or create screenshot",
					});
				}

				let remainingRequests: number | undefined;
				let nextRefillAt: Date | null = null;
				if (created) {
					const quota = await consumeQuota(context.session.user.id, {
						workspaceId: context.session.activeWorkspaceId,
						url: input.url,
						format: input.format,
						userAgent: input.userAgent,
						source: "orpc",
					});
					remainingRequests = quota.remaining;
					nextRefillAt = quota.nextRefillAt;
				}

				return {
					image: `data:image/${input.format};base64,${Buffer.from(object).toString("base64")}`,
					remainingRequests,
					nextRefillAt,
				};
			} catch (error) {
				logger.error({ err: error }, "failed to get screenshot");

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
