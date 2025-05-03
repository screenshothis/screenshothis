import { google } from "@ai-sdk/google";
import { clerkMiddleware } from "@hono/clerk-auth";
import { trpcServer } from "@hono/trpc-server";
import { streamText } from "ai";
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { stream } from "hono/streaming";

import type { Environment } from "../bindings.ts";
import { createContext } from "./lib/context.ts";
import { appRouter } from "./routers";
import { handleClerkWebhook } from "./webhooks/clerk.ts";

const app = new Hono<Environment>();

app.use(logger());
app.use(clerkMiddleware());
app.use(
	"/*",
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

app.post("/ai", async (c) => {
	const body = await c.req.json();
	const messages = body.messages || [];

	const result = streamText({
		model: google("gemini-2.5-flash-preview-04-17"),
		messages,
	});

	c.header("X-Vercel-AI-Data-Stream", "v1");
	c.header("Content-Type", "text/plain; charset=utf-8");

	return stream(c, (stream) => stream.pipe(result.toDataStream()));
});

app.post("/webhooks/clerk", handleClerkWebhook);

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
