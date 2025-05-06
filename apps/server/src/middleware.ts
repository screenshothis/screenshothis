import type { Context, Next } from "hono";

import type { Variables } from "./common/environment";

export async function workspaceMiddleware(
	c: Context<{ Variables: Variables }, "/v1/*">,
	next: Next,
) {
	const result = c.get("unkey");

	if (!result) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	if (!result.ownerId) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("workspaceId", result.ownerId);

	await next();
}
