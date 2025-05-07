import {
	PlaywrightBlocker,
	adsAndTrackingLists,
	adsLists,
} from "@ghostery/adblocker-playwright";
import type { z } from "@hono/zod-openapi";
import fetch from "cross-fetch";
import pLimit from "p-limit";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { s3 } from "../lib/s3";
import type { CreateScreenshotParamsSchema } from "../routes/screenshots/schema";

chromium.use(StealthPlugin());

function getScreenshotKey(
	url: string,
	width: number,
	height: number,
	format: string,
	cacheKey?: string,
) {
	const safeUrl = encodeURIComponent(url);
	const keyBase = `screenshots/${safeUrl}_${width}x${height}`;
	const key = cacheKey
		? `${keyBase}_${encodeURIComponent(cacheKey)}.${format}`
		: `${keyBase}.${format}`;
	return key;
}

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
			cacheKey,
		} = params;
		const key = getScreenshotKey(url, width, height, format, cacheKey);
		let object: ArrayBuffer | null = null;
		try {
			object = await s3.file(key).arrayBuffer();
			if (object) {
				return { object, key, created: false };
			}
		} catch {}

		const browser = await getBrowser();
		const context = await browser.newContext();
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

			await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });

			const buffer = await page.screenshot({
				quality: 80,
				type: "jpeg",
			});

			await s3.write(key, buffer);
		} finally {
			await page.close();
			await context.close();
		}

		try {
			object = await s3.file(key).arrayBuffer();
			if (object) {
				return { object, key, created: true };
			}
		} catch {}

		return { object: null, key, created: false };
	});
}
