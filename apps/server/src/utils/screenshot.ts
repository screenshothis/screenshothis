import {
	PlaywrightBlocker,
	adsAndTrackingLists,
	adsLists,
} from "@ghostery/adblocker-playwright";
import fetch from "cross-fetch";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type * as v from "valibot";

import { s3Client } from "#/lib/s3";
import type { takeScreenshotSchema } from "#/schemas/take-screenshot";

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

export async function getOrCreateScreenshot({
	url,
	width,
	height,
	format,
	blockAds,
	blockCookieBanners,
	blockTrackers,
}: v.InferOutput<typeof takeScreenshotSchema>): Promise<{
	object: ArrayBuffer | null;
	key: string;
	created: boolean;
}> {
	const key = getScreenshotKey(url, width, height, format);
	let object: ArrayBuffer | null = null;
	try {
		object = await s3Client.file(key).arrayBuffer();
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

		await s3Client.write(key, buffer);
	} finally {
		await browser.close();
	}

	try {
		object = await s3Client.file(key).arrayBuffer();
		if (object) {
			return { object, key, created: true };
		}
	} catch {}

	return { object: null, key, created: false };
}
