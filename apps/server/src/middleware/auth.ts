import { getSessionCookie } from "better-auth/cookies";
import { createMiddleware } from "hono/factory";

import { auth } from "../lib/auth";

export const authMiddleware = createMiddleware(async (c, next) => {
	const sessionCookie = getSessionCookie(c.req.raw);

	if (!sessionCookie) {
		c.set("user", null);
		c.set("session", null);

		return next();
	}

	try {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			c.set("user", null);
			c.set("session", null);

			return next();
		}

		c.set("user", session.user);
		c.set("session", session.session);

		return next();
	} catch (error) {
		c.set("user", null);
		c.set("session", null);

		return next();
	}
});

export const requireAuth = createMiddleware(async (c, next) => {
	const user = c.get("user");

	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	return next();
});
