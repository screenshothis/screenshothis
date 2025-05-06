import { clerkMiddleware } from "@hono/clerk-auth";
import { trpcServer } from "@hono/trpc-server";
import "dotenv/config";
import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createContext } from "./lib/context";
import { appRouter } from "./routers";
import screenshotsRoutes from "./routes/screenshots";
import webhooksRoutes from "./routes/webhooks";

const app = new Hono();

app.use(logger());
app.use(clerkMiddleware());
app.use(
	"*",
	cors({
		origin: process.env.CORS_ORIGIN || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

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
	"/openapi",
	openAPISpecs(app, {
		documentation: {
			info: {
				title: "ScreenshoThis API",
				version: "1.0.0",
				description: "API designed to take screenshots of websites",
			},
			servers: [
				{
					url: "https://api.screenshothis.com",
					description: "Production Server",
				},
			],
		},
	}),
);

const appRoutes = app
	.route("/screenshots", screenshotsRoutes)
	.route("/webhooks", webhooksRoutes);

export type AppType = typeof appRoutes;

export default app;
