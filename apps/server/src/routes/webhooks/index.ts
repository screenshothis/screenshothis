import { Webhooks } from "@polar-sh/hono";
import { Hono } from "hono";

import type { Variables } from "#/common/environment";
import { env } from "#/utils/env";
import { handleClerkWebhook } from "#/webhooks/clerk";

const webhooks = new Hono<{ Variables: Variables }>();

webhooks.post("/clerk", handleClerkWebhook);

webhooks.post(
	"/polar",
	Webhooks({
		webhookSecret: env.POLAR_WEBHOOK_SECRET,
		async onCustomerStateChanged(payload) {
			console.log(payload);
		},
	}),
);

export default webhooks;
