import "dotenv/config";

import { serve } from "@hono/node-server";
import { sentry } from "@hono/sentry";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { RPCHandler } from "@orpc/server/fetch";
import { pinoLogger } from "hono-pino";
import { every, some } from "hono/combine";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { endTime, setMetric, startTime, timing } from "hono/timing";

import type { Variables } from "./common/environment";
import { auth } from "./lib/auth";
import { createContext } from "./lib/context";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { appRouter } from "./routers";
import healthRoutes from "./routes/health";
import screenshotsRoutes from "./routes/screenshots";
import { env } from "./utils/env";

process.on("uncaughtException", (err) => {
	logger.error(err, "Uncaught exception");
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	logger.error({ promise, reason }, "Unhandled Rejection at: Promise");
	process.exit(1);
});

const app = new OpenAPIHono<{ Variables: Variables }>({
	defaultHook: (result, c) => {
		if (!result.success) {
			return c.json({ success: false, errors: result.error.errors }, 422);
		}
	},
});

app.use(timing());

app.use(async (c, next) => {
	const start = Date.now();
	await next();
	const end = Date.now();
	c.res.headers.set("X-Response-Time", `${end - start}`);
	setMetric(c, "response-time", end - start);
});

app.use(
	"*",
	sentry({
		dsn: env.SENTRY_DSN,
		enabled: process.env.NODE_ENV === "production" && !!env.SENTRY_DSN,
	}),
);

app.use(requestId());
app.use(
	pinoLogger({
		pino: logger,
	}),
);

// Optimized auth middleware for RPC routes
app.use("/rpc/*", authMiddleware);

// CORS configuration
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
	startTime(c, "rpc-processing");
	const context = await createContext({ context: c });
	const { matched, response } = await handler.handle(c.req.raw, {
		prefix: "/rpc",
		context,
	});

	endTime(c, "rpc-processing");

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

app.use(
	"/v1/screenshots/*",
	some(
		every(authMiddleware, rateLimitMiddleware({ limit: 500, window: 60000 })),
		rateLimitMiddleware({ limit: 10, window: 60000 }),
	),
);

const appRoutes = app
	.route("/v1/screenshots", screenshotsRoutes)
	.route("/health", healthRoutes);

export type AppType = typeof appRoutes;

serve(app);
