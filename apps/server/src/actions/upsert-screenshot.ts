import {
	PuppeteerBlocker,
	adsAndTrackingLists,
	adsLists,
} from "@ghostery/adblocker-puppeteer";
import type {
	CreateScreenshotSchema,
	ResourceTypeSchema,
} from "@screenshothis/schemas/screenshots";
import fetch from "cross-fetch";
import { and, eq, sql } from "drizzle-orm";
import pLimit from "p-limit";
import type { CookieData, CookieSameSite } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { ObjectToCamel } from "ts-case-convert";
import wildcardMatch from "wildcard-match";
import type { z } from "zod";

import { isScreenshotOriginAllowed } from "../actions/validate-screenshot-origin";
import { db } from "../db";
import { screenshots } from "../db/schema/screenshots";
import { logger } from "../lib/logger";
import { storage } from "../lib/storage";

puppeteer.use(StealthPlugin());

type UpsertScreenshotParams = ObjectToCamel<
	z.infer<typeof CreateScreenshotSchema>
>;

const limit = pLimit(10);

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
				sql`${screenshots.blockRequests} @> ${JSON.stringify(blockRequests || [])}`,
				sql`${screenshots.blockResources} @> ${JSON.stringify(blockResources || [])}`,
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

		const browser = await puppeteer.launch({
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

		if (cookies && cookies.length > 0) {
			const urlObj = new URL(url);
			const cookieObjs: Array<CookieData> = cookies.map((c) => ({
				name: c.name,
				value: c.value,
				domain: (c.domain ?? urlObj.hostname) as string,
				path: (c.path ?? "/") as string,
				expires: c.expires as number | undefined,
				sameSite: c.sameSite as CookieSameSite | undefined,
				secure: c.secure as boolean | undefined,
				httpOnly: c.httpOnly as boolean | undefined,
			}));
			if (cookieObjs.length > 0) {
				await browser.defaultBrowserContext().setCookie(...cookieObjs);
			}
		}

		const page = await browser.newPage();

		if (userAgent) {
			await page.setUserAgent(userAgent);
		}

		if (headers && headers.length > 0) {
			const headerObj: Record<string, string> = {};
			for (const { name, value } of headers) {
				if (!name || !value) continue;
				headerObj[name] = value;
			}
			if (Object.keys(headerObj).length > 0) {
				await page.setExtraHTTPHeaders(headerObj);
			}
		}

		if (bypassCsp) {
			await page.setBypassCSP(true);
			logger.warn({ workspaceId, url }, "[AUDIT] bypass_csp enabled");
		}

		page.emulateMediaFeatures([
			{
				name: "prefers-color-scheme",
				value: prefersColorScheme,
			},
			{
				name: "prefers-reduced-motion",
				value: prefersReducedMotion,
			},
		]);

		if (
			(blockRequests && blockRequests?.length > 0) ||
			blockResources?.length > 0
		) {
			const blockRequest = wildcardMatch(blockRequests || [], {
				separator: false,
			});

			await page.setRequestInterception(true);

			page.on("request", (request) => {
				if (blockResources?.includes(request.resourceType() as never)) {
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

			await page.goto(url, {
				waitUntil: ["load", "domcontentloaded", "networkidle2"],
			});

			let buffer: Uint8Array<ArrayBufferLike> | null = null;
			if (fullPage) {
				if (fullPageScroll) {
					const pageHeight = await page.evaluate(() => {
						return Math.max(
							document.body.scrollHeight,
							document.documentElement.scrollHeight,
							document.body.offsetHeight,
							document.documentElement.offsetHeight,
							document.body.clientHeight,
							document.documentElement.clientHeight,
						);
					});

					await page.evaluate(
						async (pageHeight, scrollDuration) => {
							const wait = (ms: number) =>
								new Promise<void>((resolve) => setTimeout(resolve, ms));

							// Start at the top
							window.scrollTo(0, 0);
							await wait(100);

							// Scroll to bottom gradually to trigger lazy loading
							const steps = 20;
							const stepSize = pageHeight / steps;
							const stepDelay = scrollDuration / steps;

							for (let i = 1; i <= steps; i++) {
								window.scrollTo(0, i * stepSize);
								await wait(stepDelay);
							}

							// Ensure we reach the bottom
							window.scrollTo(0, pageHeight);
							await wait(300);

							// Return to top
							window.scrollTo(0, 0);
							await wait(300);

							// Wait for all images to load
							const images = Array.from(document.querySelectorAll("img"));
							await Promise.all(
								images.map((img) => {
									if (img.complete && img.naturalHeight !== 0) {
										return Promise.resolve();
									}
									return new Promise((resolve, reject) => {
										const timeout = setTimeout(() => {
											resolve(undefined); // Don't fail the entire process for one image
										}, 5000);

										img.onload = () => {
											clearTimeout(timeout);
											resolve(undefined);
										};
										img.onerror = () => {
											clearTimeout(timeout);
											resolve(undefined); // Don't fail the entire process for one image
										};
									});
								}),
							);
						},
						pageHeight,
						fullPageScrollDuration,
					);
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
					blockRequests,
					blockResources: blockResources as Array<
						z.infer<typeof ResourceTypeSchema>
					>,
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

			await page.close();

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
			if (!page.isClosed()) await page.close();
			await browser.close();
		}
	});
}
