import { clerkMiddleware } from "@hono/clerk-auth";
import { swaggerUI } from "@hono/swagger-ui";
import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { unkey } from "@unkey/hono";
import "dotenv/config";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";

import type { Variables } from "./common/environment";
import { env } from "./env";
import { createContext } from "./lib/context";
import { workspaceMiddleware } from "./middleware";
import { appRouter } from "./routers";
import screenshotsRoutes from "./routes/screenshots";
import webhooksRoutes from "./routes/webhooks";

const app = new OpenAPIHono<{ Variables: Variables }>({
	defaultHook: (result, c) => {
		if (!result.success) {
			return c.json({ success: false, errors: result.error.errors }, 422);
		}
	},
});

app.use(logger());
app.use(requestId());
app.use(
	"*",
	cors({
		origin: env.CORS_ORIGIN || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.use("/trpc/*", clerkMiddleware());
app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.use(
	"/v1/*",
	unkey({
		apiId: env.UNKEY_API_ID,
		getKey: (c) => c.req.header("x-screenshothis-key"),
	}),
);
app.use("/v1/*", workspaceMiddleware);

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
	type: "http",
	scheme: "bearer",
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
