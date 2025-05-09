import {
	PuppeteerBlocker,
	adsAndTrackingLists,
	adsLists,
} from "@ghostery/adblocker-puppeteer";
import type { z } from "@hono/zod-openapi";
import fetch from "cross-fetch";
import { and, eq, sql } from "drizzle-orm";
import pLimit from "p-limit";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import wildcardMatch from "wildcard-match";

import { db } from "../db";
import { screenshots } from "../db/schema/screenshots";
import { s3 } from "../lib/s3";
import type { CreateScreenshotParamsSchema } from "../routes/screenshots/schema";

puppeteer.use(StealthPlugin());

type GetOrCreateScreenshotParams = z.infer<typeof CreateScreenshotParamsSchema>;

const limit = pLimit(5);

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
			blockRequests,
			blockResources,
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
				sql`${screenshots.blockRequests} @> ${JSON.stringify(blockRequests)}`,
				sql`${screenshots.blockResources} @> ${JSON.stringify(blockResources)}`,
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
		const browser = await puppeteer.launch({
			headless: true,
			defaultViewport: { width, height },
		});
		const page = await browser.newPage();

		if (blockRequests?.length || blockResources?.length) {
			const blockRequest = wildcardMatch(blockRequests, { separator: false });

			page.on("request", (request) => {
				if (blockResources?.includes(request.resourceType())) {
					request.abort();
					return;
				}

				if (blockRequest(request.url())) {
					request.abort();
					return;
				}

				request.continue();
			});
		}

		try {
			const blocker = await PuppeteerBlocker.fromLists(fetch, [
				...(blockAds ? adsLists : []),
				...(blockCookieBanners
					? [
							"https://secure.fanboy.co.nz/fanboy-cookiemonster.txt",
							"https://secure.fanboy.co.nz/fanboy-annoyance.txt",
						]
					: []),
				...(blockTrackers ? adsAndTrackingLists : []),
			]);
			await blocker.enableBlockingInPage(page);

			await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

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
					blockRequests,
					workspaceId,
				})
				.returning();

			const key = `screenshots/${workspaceId}/${inserted.id}.${format}`;
			await s3.write(key, buffer);
			await page.close();

			const object = await s3.file(key).arrayBuffer();

			return { object, key, created: true };
		} finally {
			// Ensure resources are closed if not already
			if (!page.isClosed()) await page.close();
			await browser.close();
		}
	});
}
