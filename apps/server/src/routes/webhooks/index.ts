import { Hono } from "hono";

import type { Variables } from "#/common/environment";
import { handleClerkWebhook } from "#/webhooks/clerk";

const webhooks = new Hono<{ Variables: Variables }>();

webhooks.post("/clerk", handleClerkWebhook);

export default webhooks;
