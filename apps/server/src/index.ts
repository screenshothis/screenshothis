import { clerkMiddleware } from "@hono/clerk-auth";
import { swaggerUI } from "@hono/swagger-ui";
import { trpcServer } from "@hono/trpc-server";
import "dotenv/config";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { OpenAPIHono } from "@hono/zod-openapi";
import { createContext } from "./lib/context";
import { appRouter } from "./routers";
import screenshotsRoutes from "./routes/screenshots";
import webhooksRoutes from "./routes/webhooks";

const app = new OpenAPIHono({
	defaultHook: (result, c) => {
		if (!result.success) {
			return c.json({ success: false, errors: result.error.errors }, 422);
		}
	},
});

app.use(logger());
app.use(
	"*",
	cors({
		origin: process.env.CORS_ORIGIN || "",
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
	.route("/screenshots", screenshotsRoutes)
	.route("/webhooks", webhooksRoutes);

export type AppType = typeof appRoutes;

export default app;
