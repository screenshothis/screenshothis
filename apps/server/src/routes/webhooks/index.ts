import { Hono } from "hono";

import { handleClerkWebhook } from "#/webhooks/clerk";

const webhooks = new Hono();

webhooks.post("/clerk", handleClerkWebhook);

export default webhooks;
