import type { Context, Next } from "hono";

import type { Variables } from "./common/environment";
import { auth } from "./lib/auth";

export async function workspaceMiddleware(
	c: Context<{ Variables: Variables }, "/v1/*">,
	next: Next,
) {
	const result = await auth.api.getSession(c.req.raw);

	if (!result) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	if (!result.session.activeWorkspaceId) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("workspaceId", result.session.activeWorkspaceId);

	await next();
}
