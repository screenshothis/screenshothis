import {
	PlaywrightBlocker,
	adsAndTrackingLists,
	adsLists,
} from "@ghostery/adblocker-playwright";
import type { z } from "@hono/zod-openapi";
import fetch from "cross-fetch";
import { and, eq } from "drizzle-orm";
import pLimit from "p-limit";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { db } from "../db";
import { screenshots } from "../db/schema/screenshots";
import { s3 } from "../lib/s3";
import type { CreateScreenshotParamsSchema } from "../routes/screenshots/schema";

chromium.use(StealthPlugin());

type GetOrCreateScreenshotParams = z.infer<typeof CreateScreenshotParamsSchema>;

let browserPromise: ReturnType<typeof chromium.launch> | null = null;
const limit = pLimit(5);

async function getBrowser() {
	if (!browserPromise) {
		browserPromise = chromium.launch({ headless: true });
	}
	return browserPromise;
}

export async function getOrCreateScreenshot(
	workspaceId: string,
	params: GetOrCreateScreenshotParams,
): Promise<{
	object: ArrayBuffer | null;
	key: string;
	created: boolean;
}> {
	return limit(async () => {
		const {
			url,
			width,
			height,
			format,
			blockAds,
			blockCookieBanners,
			blockTrackers,
		} = params;

		// 1. Check DB for existing screenshot
		const existing = await db.query.screenshots.findFirst({
			where: and(
				eq(screenshots.url, url),
				eq(screenshots.width, width),
				eq(screenshots.height, height),
				eq(screenshots.format, format),
				eq(screenshots.blockAds, blockAds),
				eq(screenshots.blockCookieBanners, blockCookieBanners),
				eq(screenshots.blockTrackers, blockTrackers),
				eq(screenshots.workspaceId, workspaceId),
			),
		});

		if (existing) {
			const key = `screenshots/${workspaceId}/${existing.id}.${format}`;
			try {
				const object = await s3.file(key).arrayBuffer();
				if (object) {
					return { object, key, created: false };
				}
			} catch {}
		}

		// 2. Not found, generate screenshot
		const browser = await getBrowser();
		const context = await browser.newContext({
			viewport: { width, height },
		});
		const page = await context.newPage();
		try {
			const blocker = await PlaywrightBlocker.fromLists(fetch, [
				...(blockAds ? adsLists : []),
				...(blockCookieBanners
					? ["https://secure.fanboy.co.nz/fanboy-cookiemonster.txt"]
					: []),
				...(blockTrackers ? adsAndTrackingLists : []),
			]);
			await blocker.enableBlockingInPage(page);

			await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

			const buffer = await page.screenshot({
				quality: 80,
				type: "jpeg",
			});

			// 3. Insert new DB record
			const [inserted] = await db
				.insert(screenshots)
				.values({
					url,
					width,
					height,
					format,
					blockAds,
					blockCookieBanners,
					blockTrackers,
					workspaceId,
				})
				.returning();

			const key = `screenshots/${workspaceId}/${inserted.id}.${format}`;
			await s3.write(key, buffer);
			await page.close();
			await context.close();

			const object = await s3.file(key).arrayBuffer();
			return { object, key, created: true };
		} finally {
			// Ensure resources are closed if not already
			if (!page.isClosed()) await page.close();
			await context.close();
		}
	});
}
