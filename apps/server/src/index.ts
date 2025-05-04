import { google } from "@ai-sdk/google";
import { clerkMiddleware } from "@hono/clerk-auth";
import { trpcServer } from "@hono/trpc-server";
import { streamText } from "ai";
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { stream } from "hono/streaming";
import { v4 as uuidv4 } from "uuid";

import type { MessageBatch } from "@cloudflare/workers-types";
import type { Environment } from "../bindings.ts";
import { createContext } from "./lib/context.ts";
import { appRouter } from "./routers";
import { handleClerkWebhook } from "./webhooks/clerk.ts";

const app = new Hono<Environment>();

app.use(logger());
app.use(clerkMiddleware());

app.use("/*", async (c, next) => {
	const clerk = clerkMiddleware({
		publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
		secretKey: c.env.CLERK_SECRET_KEY,
	});
	return clerk(c, next);
});

app.use("/*", async (c, next) => {
	const corsMiddleware = cors({
		origin: c.env.CORS_ORIGIN || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	});
	return corsMiddleware(c, next);
});

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

const pendingScreenshots = new Map<string, (result: ArrayBuffer) => void>();

app.get("/take", async (c) => {
	const url = c.req.query("url") || "";
	const width = Number(c.req.query("width")) || 1200;
	const height = Number(c.req.query("height")) || 630;
	const format = c.req.query("format") || "jpg";
	const workspaceId = c.req.query("workspaceId") || "";
	const jobId = uuidv4();
	await c.env.SCREENSHOT_QUEUE.send({
		url,
		width,
		height,
		format,
		workspaceId,
		jobId,
	});

	const result = await new Promise<ArrayBuffer>((resolve) => {
		pendingScreenshots.set(jobId, resolve);
	});

	return new Response(result, {
		headers: { "Content-Type": `image/${format}` },
	});
});

app.get("/", (c) => {
	return c.text("OK");
});

export default {
	fetch: app.fetch,
	async queue(
		batch: MessageBatch<{
			url: string;
			width: number;
			height: number;
			format: string;
			workspaceId: string;
			jobId: string;
		}>,
		env: Environment,
	) {
		for (const message of batch.messages) {
			const { url, width, height, format, workspaceId, jobId } = message.body;
			const accountId = env.Bindings.CLOUDFLARE_ACCOUNT_ID;
			const apiToken = env.Bindings.CLOUDFLARE_API_TOKEN;

			const response = await fetch(
				`https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/screenshot`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${apiToken}`,
					},
					body: JSON.stringify({
						url,
						viewport: { width, height },
						format,
					}),
				},
			);

			const data = await response.arrayBuffer();

			const cb = pendingScreenshots.get(jobId);
			if (cb) {
				cb(data);
				pendingScreenshots.delete(jobId);
			}

			message.ack();
		}
	},
};
