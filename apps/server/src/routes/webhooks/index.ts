import { Webhooks } from "@polar-sh/hono";
import { Hono } from "hono";

import type { Variables } from "#/common/environment";
import { db } from "#/db";
import * as schema from "#/db/schema";
import { env } from "#/utils/env";
import { handleClerkWebhook } from "#/webhooks/clerk";

const webhooks = new Hono<{ Variables: Variables }>();

webhooks.post("/clerk", handleClerkWebhook);

webhooks.post(
	"/polar",
	Webhooks({
		webhookSecret: env.POLAR_WEBHOOK_SECRET,
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
	}),
);

export default webhooks;
