import { Checkout } from "@polar-sh/hono";
import { z } from "zod";

import { protectedProcedure } from "#/lib/orpc";
import { env } from "#/utils/env";

export const checkoutsRouter = {
	create: protectedProcedure
		.input(
			z.object({
				products: z.array(z.string()),
				customerId: z.string().nullish(),
				customerExternalId: z.string().nullish(),
				customerEmail: z.string().nullish(),
				customerName: z.string().nullish(),
				customerMetadata: z
					.record(
						z.string(),
						z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
					)
					.nullish(),
				metadata: z
					.record(
						z.string(),
						z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
					)
					.nullish(),
			}),
		)
		.handler(async () =>
			Checkout({
				accessToken: env.POLAR_ACCESS_TOKEN,
				successUrl: env.POLAR_SUCCESS_URL,
				server: env.POLAR_SERVER,
				includeCheckoutId: true,
			}),
		),
};
