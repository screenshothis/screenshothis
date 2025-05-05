import { google } from "@ai-sdk/google";
import { clerkMiddleware } from "@hono/clerk-auth";
import { trpcServer } from "@hono/trpc-server";
import { streamText } from "ai";
import Cloudflare from "cloudflare";
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { stream } from "hono/streaming";

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

app.get("/take", async (c) => {
	const url = c.req.query("url") || "";
	const width = Number(c.req.query("width")) || 1200;
	const height = Number(c.req.query("height")) || 630;
	const format = c.req.query("format") || "png";
	const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;
	const apiToken = c.env.CLOUDFLARE_API_TOKEN;

	const cloudflare = new Cloudflare({ apiToken });

	const screenshot = await cloudflare.browserRendering.screenshot.create({
		account_id: accountId,
		url,
		screenshotOptions: {
			encoding: "base64",
			type: format as "png" | "jpeg" | "webp",
		},
		viewport: { width, height },
		gotoOptions: {
			waitUntil: "networkidle0",
			timeout: 45000,
		},
	});

	if (!screenshot.status) {
		return c.json({ error: screenshot.errors }, 500);
	}

	const result: unknown = screenshot as unknown;
	let base64Image: string | undefined;
	if (
		result &&
		typeof result === "object" &&
		"image" in result &&
		typeof (result as { image: unknown }).image === "string"
	) {
		base64Image = (result as { image: string }).image;
	} else if (typeof result === "string") {
		base64Image = result;
	} else {
		return c.json({ error: "No image data in screenshot response" }, 500);
	}
	const imageBuffer = Buffer.from(base64Image ?? "", "base64");
	const key = `screenshots/${Date.now()}-${Math.random().toString(36).slice(2)}.${format}`;
	await c.env.SCREENSHOTS_BUCKET.put(key, imageBuffer, {
		httpMetadata: { contentType: `image/${format}` },
	});

	const object = await c.env.SCREENSHOTS_BUCKET.get(key);
	if (!object) {
		return c.json({ error: "Failed to retrieve image from R2" }, 500);
	}

	return new Response(await object.arrayBuffer(), {
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

			message.ack();
		}
	},
};
