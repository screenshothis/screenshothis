import { checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";

import { db } from "../db";
import * as schema from "../db/schema";
import { env } from "../utils/env";

export const polarClient = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN,
	server: env.POLAR_SERVER,
});

export const polarProducts: Array<{
	productId: string;
	slug: string;
}> = [];

if (env.POLAR_LITE_PRODUCT_ID) {
	polarProducts.push({
		productId: env.POLAR_LITE_PRODUCT_ID,
		slug: "lite",
	});
}

if (env.POLAR_PRO_PRODUCT_ID) {
	polarProducts.push({
		productId: env.POLAR_PRO_PRODUCT_ID,
		slug: "pro",
	});
}

if (env.POLAR_ENTERPRISE_PRODUCT_ID) {
	polarProducts.push({
		productId: env.POLAR_ENTERPRISE_PRODUCT_ID,
		slug: "enterprise",
	});
}

export const polarPlugins = [
	checkout({
		products: polarProducts,
		successUrl: env.POLAR_SUCCESS_URL,
		authenticatedUsersOnly: true,
	}),
	portal(),
	usage(),
];

if (env.POLAR_ACCESS_TOKEN) {
	polarPlugins.push(
		checkout({
			products: polarProducts,
			successUrl: env.POLAR_SUCCESS_URL,
			authenticatedUsersOnly: true,
		}),
		portal(),
		usage(),
	);

	if (env.POLAR_WEBHOOK_SECRET) {
		polarPlugins.push(
			webhooks({
				secret: env.POLAR_WEBHOOK_SECRET,
				async onCustomerStateChanged(payload) {
					await db
						.insert(schema.polarCustomerState)
						.values({
							metadata: payload.data.metadata,
							externalId: payload.data.externalId,
							email: payload.data.email,
							name: payload.data.name,
							activeSubscriptions: payload.data.activeSubscriptions,
							grantedBenefits: payload.data.grantedBenefits,
							activeMeters: payload.data.activeMeters,
						})
						.onConflictDoUpdate({
							target: schema.polarCustomerState.externalId,
							set: {
								metadata: payload.data.metadata,
								activeSubscriptions: payload.data.activeSubscriptions,
								grantedBenefits: payload.data.grantedBenefits,
								activeMeters: payload.data.activeMeters,
							},
						});
				},
				async onSubscriptionCreated(payload) {
					const data = payload.data;

					const productSlug = await getProductSlugById(data.productId);

					if (!data.customer.externalId) {
						throw new Error("Customer external ID is required");
					}

					await updateUserRequestLimits(data.customer.externalId, productSlug);
				},
			}),
		);
	}
}
