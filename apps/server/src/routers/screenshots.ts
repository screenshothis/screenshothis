import { ORPCError } from "@orpc/server";
import { CreateScreenshotSchema } from "@screenshothis/schemas/screenshots";
import { and, eq, like } from "drizzle-orm";
import { objectToCamel } from "ts-case-convert";
import { z } from "zod";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { protectedProcedure } from "#/lib/orpc";
import { unkey } from "#/lib/unkey";
import { getOrCreateScreenshot } from "#/utils/screenshot";

export const screenshotsRouter = {
	create: protectedProcedure
		.input(CreateScreenshotSchema.transform((data) => objectToCamel(data)))
		.handler(async ({ context, input }) => {
			if (!context.session.session.activeWorkspaceId) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "Current workspace not found",
				});
			}

			try {
				const { object, created } = await getOrCreateScreenshot(
					context.session.session.activeWorkspaceId,
					input,
				);

				if (!object) {
					throw new ORPCError("NOT_FOUND", {
						message: "Failed to get or create screenshot",
					});
				}

				const accessToken = await db.query.accessTokens.findFirst({
					where: eq(
						schema.accessTokens.workspaceId,
						context.session.session.activeWorkspaceId,
					),
					columns: {
						token: true,
						externalId: true,
					},
				});

				if (accessToken?.externalId && created) {
					await unkey.keys.updateRemaining({
						keyId: accessToken.externalId,
						op: "decrement",
						value: 1,
					});
				}

				return {
					image: `data:image/${input.format};base64,${Buffer.from(object).toString("base64")}`,
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
			if (!context.session.session.activeWorkspaceId) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "Current workspace not found",
				});
			}

			const screenshots = await db.query.screenshots.findMany({
				where: and(
					eq(
						schema.screenshots.workspaceId,
						context.session.session.activeWorkspaceId,
					),
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
					hasTouch: true,
					format: true,
					blockAds: true,
					blockCookieBanners: true,
					blockTrackers: true,
					blockRequests: true,
					blockResources: true,
					prefersColorScheme: true,
					prefersReducedMotion: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			return screenshots;
		}),
};
