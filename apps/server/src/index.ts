import { clerkMiddleware } from "@hono/clerk-auth";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { RPCHandler } from "@orpc/server/fetch";
import { unkey } from "@unkey/hono";
import "dotenv/config";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";

import type { Variables } from "./common/environment";
import { createContext } from "./lib/context";
import { workspaceMiddleware } from "./middleware";
import { appRouter } from "./routers";
import screenshotsRoutes from "./routes/screenshots";
import webhooksRoutes from "./routes/webhooks";
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
app.use("/rpc/*", clerkMiddleware());
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

app.use(
	"/v1/*",
	unkey({
		apiId: env.UNKEY_API_ID,
		getKey: (c) => c.req.query("api_key"),
	}),
);
app.use("/v1/*", workspaceMiddleware);

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
		title: "ScreenshoThis API",
		description: "API designed to take screenshots of websites",
	},
	servers: [
		{
			url: "https://api.screenshothis.com",
			description: "Production Server",
		},
	],
});

const appRoutes = app
	.route("/v1/screenshots", screenshotsRoutes)
	.route("/webhooks", webhooksRoutes);

export type AppType = typeof appRoutes;

export default app;
