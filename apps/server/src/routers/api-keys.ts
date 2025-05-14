import { ApiKeysFilterSchema } from "@screenshothis/schemas/api-keys";
import { z } from "zod";

import { auth } from "#/lib/auth";
import { protectedProcedure } from "#/lib/orpc";

export const apiKeysRouter = {
	create: protectedProcedure
		.input(
			z.object({
				name: z.string(),
			}),
		)
		.handler(async ({ context, input }) => {
			const apiKey = await auth.api.createApiKey({
				body: {
					...input,
					userId: context.session.user.id,
				},
			});

			return {
				key: apiKey.key,
			};
		}),
	list: protectedProcedure
		.input(ApiKeysFilterSchema.optional())
		.handler(async ({ context, input }) => {
			const apiKeys = await auth.api.listApiKeys();

			return apiKeys.map((apiKey) => ({
				id: apiKey.id,
				name: apiKey.name,
				createdAt: apiKey.createdAt,
				updatedAt: apiKey.updatedAt,
			}));
		}),
};
