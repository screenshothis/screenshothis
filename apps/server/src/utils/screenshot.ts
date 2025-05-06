import {
	PlaywrightBlocker,
	adsAndTrackingLists,
	adsLists,
} from "@ghostery/adblocker-playwright";
import type { z } from "@hono/zod-openapi";
import fetch from "cross-fetch";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { s3 } from "#/lib/s3";
import type { CreateScreenshotParamsSchema } from "#/routes/screenshots/schema";

chromium.use(StealthPlugin());

function getScreenshotKey(
	url: string,
	width: number,
	height: number,
	format: string,
) {
	const safeUrl = encodeURIComponent(url);
	return `screenshots/${safeUrl}_${width}x${height}.${format}`;
}

type GetOrCreateScreenshotParams = z.infer<typeof CreateScreenshotParamsSchema>;

export async function getOrCreateScreenshot({
	url,
	width,
	height,
	format,
	blockAds,
	blockCookieBanners,
	blockTrackers,
}: GetOrCreateScreenshotParams): Promise<{
	object: ArrayBuffer | null;
	key: string;
	created: boolean;
}> {
	const key = getScreenshotKey(url, width, height, format);
	let object: ArrayBuffer | null = null;
	try {
		object = await s3.file(key).arrayBuffer();
		if (object) {
			return { object, key, created: false };
		}
	} catch {}

	const browser = await chromium.launch({ headless: true });

	try {
		const blocker = await PlaywrightBlocker.fromLists(fetch, [
			...(blockAds ? adsLists : []),
			...(blockCookieBanners
				? ["https://secure.fanboy.co.nz/fanboy-cookiemonster.txt"]
				: []),
			...(blockTrackers ? adsAndTrackingLists : []),
		]);
		const page = await browser.newPage({
			viewport: {
				width,
				height,
			},
		});
		await blocker.enableBlockingInPage(page);

		await page.goto(url, { waitUntil: "networkidle" });

		const buffer = await page.screenshot({
			quality: 80,
			type: "jpeg",
		});

		await s3.write(key, buffer);
	} finally {
		await browser.close();
	}

	try {
		object = await s3.file(key).arrayBuffer();
		if (object) {
			return { object, key, created: true };
		}
	} catch {}

	return { object: null, key, created: false };
}
