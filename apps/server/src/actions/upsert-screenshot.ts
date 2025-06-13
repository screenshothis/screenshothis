import type {
	CreateScreenshotSchema,
	ResourceTypeSchema,
} from "@screenshothis/schemas/screenshots";
import { and, eq, sql } from "drizzle-orm";
import pLimit from "p-limit";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { ObjectToCamel } from "ts-case-convert";
import type { z } from "zod";

import { isScreenshotOriginAllowed } from "../actions/validate-screenshot-origin";
import { db } from "../db";
import { screenshots } from "../db/schema/screenshots";
import { logger } from "../lib/logger";
import { storage } from "../lib/storage";
import { env } from "../utils/env";
import {
	applyCookies,
	applyHeadersAndAgent,
	applyPagePreferences,
	performFullPageScroll,
	setupAdAndTrackerBlocking,
	setupRequestBlocking,
} from "../utils/screenshot-helpers";

puppeteer.use(StealthPlugin());

type UpsertScreenshotParams = ObjectToCamel<
	z.infer<typeof CreateScreenshotSchema>
>;

const limit = pLimit(env.SCREENSHOT_CONCURRENCY);

export async function upsertScreenshot(
	workspaceId: string,
	params: UpsertScreenshotParams,
): Promise<{
	object: ArrayBuffer | null;
	key: string | null;
	created: boolean;
}> {
	return limit(async () => {
		const {
			url,
			selector,
			width,
			height,
			isMobile,
			isLandscape,
			hasTouch,
			deviceScaleFactor,
			fullPage,
			fullPageScroll,
			fullPageScrollDuration,
			format,
			quality,
			blockAds,
			blockCookieBanners,
			blockTrackers,
			blockRequests,
			blockResources,
			prefersColorScheme,
			prefersReducedMotion,
			isCached,
			cacheTtl,
			cacheKey,
			userAgent,
			headers = [],
			cookies = [],
			bypassCsp,
		} = params;

		const sortedBlockRequests = (blockRequests || []).slice().sort();
		const sortedBlockResources = (blockResources || []).slice().sort();

		const existing = await db.query.screenshots.findFirst({
			where: and(
				eq(screenshots.url, url),
				selector ? eq(screenshots.selector, selector) : undefined,
				eq(screenshots.width, width),
				eq(screenshots.height, height),
				eq(screenshots.isMobile, isMobile),
				eq(screenshots.isLandscape, isLandscape),
				eq(screenshots.hasTouch, hasTouch),
				eq(screenshots.deviceScaleFactor, deviceScaleFactor),
				eq(screenshots.fullPage, fullPage),
				eq(screenshots.fullPageScroll, fullPageScroll),
				fullPageScrollDuration
					? eq(screenshots.fullPageScrollDuration, fullPageScrollDuration)
					: undefined,
				eq(screenshots.format, format),
				eq(screenshots.quality, quality),
				eq(screenshots.blockAds, blockAds),
				eq(screenshots.blockCookieBanners, blockCookieBanners),
				eq(screenshots.blockTrackers, blockTrackers),
				sql`${screenshots.blockRequests} @> ${JSON.stringify(sortedBlockRequests)} AND ${JSON.stringify(sortedBlockRequests)}::jsonb @> ${screenshots.blockRequests}`,
				sql`${screenshots.blockResources} @> ${JSON.stringify(sortedBlockResources)} AND ${JSON.stringify(sortedBlockResources)}::jsonb @> ${screenshots.blockResources}`,
				eq(screenshots.prefersColorScheme, prefersColorScheme),
				eq(screenshots.prefersReducedMotion, prefersReducedMotion),
				eq(screenshots.workspaceId, workspaceId),
				eq(screenshots.isCached, isCached),
				cacheTtl ? eq(screenshots.cacheTtl, cacheTtl) : undefined,
				cacheKey ? eq(screenshots.cacheKey, cacheKey) : undefined,
				userAgent ? eq(screenshots.userAgent, userAgent) : undefined,
				sql`${screenshots.headers} @> ${JSON.stringify(headers || [])}`,
				sql`${screenshots.cookies} @> ${JSON.stringify(cookies || [])}`,
				eq(screenshots.bypassCsp, bypassCsp),
			),
		});

		if (existing) {
			const key = `screenshots/${workspaceId}/${existing.id}.${format}`;

			try {
				const object = await storage.file(key).arrayBuffer();
				return { object, key, created: false };
			} catch (error) {
				logger.warn(
					{
						err: error,
						key,
						screenshotId: existing.id,
						workspaceId,
					},
					"Existing screenshot file not found in S3, will regenerate",
				);

				// Delete the orphaned database record so we can regenerate
				try {
					await db.delete(screenshots).where(eq(screenshots.id, existing.id));
					logger.info(
						{ screenshotId: existing.id, key },
						"Cleaned up orphaned screenshot record",
					);
				} catch (cleanupError) {
					logger.error(
						{ err: cleanupError, screenshotId: existing.id },
						"Failed to cleanup orphaned screenshot record",
					);
				}

				// Continue to generate a new screenshot
			}
		}

		const allowed = await isScreenshotOriginAllowed(workspaceId, url);
		if (!allowed) {
			return { object: null, key: null, created: false };
		}

		const startTime = Date.now();

		let browser: import("puppeteer").Browser | null = null;
		let page: import("puppeteer").Page | null = null;

		try {
			browser = await puppeteer.launch({
				headless: true,
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
				defaultViewport: {
					width: Math.round(width / deviceScaleFactor),
					height: Math.round(height / deviceScaleFactor),
					isMobile,
					isLandscape,
					hasTouch,
					deviceScaleFactor: deviceScaleFactor,
				},
			});

			await applyCookies(browser, url, cookies);

			page = await browser.newPage();

			await applyHeadersAndAgent(page, userAgent, headers);

			await applyPagePreferences(
				page,
				bypassCsp,
				prefersColorScheme,
				prefersReducedMotion,
			);
			if (bypassCsp) {
				logger.warn({ workspaceId, url }, "[AUDIT] bypass_csp enabled");
			}

			await setupRequestBlocking(
				page,
				blockRequests || [],
				blockResources || [],
			);

			await setupAdAndTrackerBlocking(page, {
				blockAds: !!blockAds,
				blockCookieBanners: !!blockCookieBanners,
				blockTrackers: !!blockTrackers,
			});

			await page.goto(url, {
				waitUntil: ["load", "domcontentloaded", "networkidle2"],
			});

			let buffer: Uint8Array<ArrayBufferLike> | null = null;
			if (fullPage) {
				if (fullPageScroll) {
					await performFullPageScroll(page, fullPageScrollDuration);
				}

				buffer = await page.screenshot({
					type: "jpeg",
					quality,
					fullPage: true,
				});
			} else {
				if (selector) {
					await page.waitForSelector(selector);
					const element = await page.$(selector);
					if (element) {
						buffer = await element.screenshot({
							quality,
							type: format,
						});
					}
				} else {
					buffer = await page.screenshot({
						quality,
						type: format,
					});
				}
			}

			if (!buffer) {
				throw new Error("Failed to generate screenshot");
			}

			const [inserted] = await db
				.insert(screenshots)
				.values({
					url,
					selector,
					width,
					height,
					isMobile,
					isLandscape,
					hasTouch,
					deviceScaleFactor,
					fullPage,
					fullPageScroll,
					fullPageScrollDuration,
					format,
					quality,
					blockAds,
					blockCookieBanners,
					blockTrackers,
					blockRequests: blockRequests ? [...blockRequests].sort() : undefined,
					blockResources: blockResources
						? ((blockResources as string[]).slice().sort() as Array<
								z.infer<typeof ResourceTypeSchema>
							>)
						: undefined,
					prefersColorScheme,
					prefersReducedMotion,
					isCached,
					cacheTtl,
					cacheKey,
					userAgent,
					headers,
					cookies,
					bypassCsp,
					duration: Number.parseFloat(
						((Date.now() - startTime) / 1000).toFixed(2),
					),
					workspaceId,
				})
				.returning();

			const key = `screenshots/${workspaceId}/${inserted.id}.${format}`;

			try {
				await storage.write(key, buffer);
				logger.info(
					{ key, size: buffer.length },
					"Screenshot uploaded to S3 successfully",
				);
			} catch (uploadError) {
				logger.error(
					{ err: uploadError, key, screenshotId: inserted.id },
					"Failed to upload screenshot to S3",
				);

				try {
					await db.delete(screenshots).where(eq(screenshots.id, inserted.id));
					logger.info(
						{ screenshotId: inserted.id },
						"Cleaned up screenshot record after S3 upload failure",
					);
				} catch (cleanupError) {
					logger.error(
						{ err: cleanupError, screenshotId: inserted.id },
						"Failed to cleanup screenshot record after S3 upload failure",
					);
				}

				throw new Error(
					`Screenshot generation failed: S3 upload error - ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`,
				);
			}

			let object: ArrayBuffer;
			try {
				object = await storage.file(key).arrayBuffer();
				logger.info({ key }, "Screenshot verified in S3");
			} catch (verifyError) {
				logger.error(
					{ err: verifyError, key, screenshotId: inserted.id },
					"Screenshot upload succeeded but verification failed",
				);
				throw new Error(
					`Screenshot generation failed: S3 verification error - ${verifyError instanceof Error ? verifyError.message : "Unknown error"}`,
				);
			}

			return { object, key, created: true };
		} finally {
			// Ensure resources are closed if not already
			try {
				if (page && !page.isClosed()) await page.close();
			} catch {}
			if (browser) await browser.close();
		}
	});
}
