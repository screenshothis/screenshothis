import "dotenv/config";

import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { RPCHandler } from "@orpc/server/fetch";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";

import type { Variables } from "./common/environment";
import { auth } from "./lib/auth";
import { createContext } from "./lib/context";
import { appRouter } from "./routers";
import screenshotsRoutes from "./routes/screenshots";
import { env } from "./utils/env";

const app = new OpenAPIHono<{ Variables: Variables }>({
	defaultHook: (result, c) => {
		if (!result.success) {
			return c.json({ success: false, errors: result.error.errors }, 422);
		}
	},
});

app.use(logger());
app.use(requestId());

app.use("/rpc/*", async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		c.set("user", null);
		c.set("session", null);
		return next();
	}

	c.set("user", session.user);
	c.set("session", session.session);
	return next();
});

app.use(
	"/auth/*",
	cors({
		origin: env.CORS_ORIGIN || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);
app.on(["POST", "GET"], "/auth/**", (c) => auth.handler(c.req.raw));

const handler = new RPCHandler(appRouter);
app.use(
	"/rpc/*",
	cors({
		origin: env.CORS_ORIGIN || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);
app.use("/rpc/*", async (c, next) => {
	const context = await createContext({ context: c });
	const { matched, response } = await handler.handle(c.req.raw, {
		prefix: "/rpc",
		context,
	});

	if (matched) {
		return c.newResponse(response.body, response);
	}

	await next();
});

app.openAPIRegistry.registerComponent("securitySchemes", "ApiKeyQuery", {
	type: "apiKey",
	in: "query",
	name: "api_key",
});

app.get(
	"/",
	swaggerUI({
		url: "/openapi",
	}),
);

app.doc("/openapi", {
	openapi: "3.1.0",
	info: {
		version: "1.0.0",
		title: "Screenshothis API",
		description: "API designed to take screenshots of websites",
	},
	servers: [
		{
			url: "https://api.screenshothis.com",
			description: "Production Server",
		},
	],
});

const appRoutes = app.route("/v1/screenshots", screenshotsRoutes);

export type AppType = typeof appRoutes;

export default app;
