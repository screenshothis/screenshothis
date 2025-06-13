import {
	PuppeteerBlocker,
	adsAndTrackingLists,
	adsLists,
} from "@ghostery/adblocker-puppeteer";
import type { ResourceTypeSchema } from "@screenshothis/schemas/screenshots";
import fetch from "cross-fetch";
import type {
	Browser,
	CookieData,
	CookieSameSite,
	HTTPRequest,
	Page,
} from "puppeteer";
import wildcardMatch from "wildcard-match";
import type { z } from "zod";

/**
 * Apply the provided cookies to the default browser context so they are available to all pages.
 */
export async function applyCookies(
	browser: Browser,
	targetUrl: string,
	cookies: Array<{
		name: string;
		value: string;
		domain?: string;
		path?: string;
		expires?: number;
		sameSite?: string;
		secure?: boolean;
		httpOnly?: boolean;
	}> = [],
): Promise<void> {
	if (!cookies.length) return;

	const urlObj = new URL(targetUrl);
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

	await browser.defaultBrowserContext().setCookie(...cookieObjs);
}

/**
 * Configure user-agent and custom headers for the given page.
 */
export async function applyHeadersAndAgent(
	page: Page,
	userAgent: string | undefined | null,
	headers: Array<{ name: string; value: string }> = [],
): Promise<void> {
	if (userAgent) {
		await page.setUserAgent(userAgent);
	}

	if (headers.length > 0) {
		const headerObj: Record<string, string> = {};
		for (const { name, value } of headers) {
			if (!name || !value) continue;
			headerObj[name] = value;
		}
		if (Object.keys(headerObj).length > 0) {
			await page.setExtraHTTPHeaders(headerObj);
		}
	}
}

/**
 * Apply CSP bypass and media emulation preferences.
 */
export async function applyPagePreferences(
	page: Page,
	bypassCsp: boolean | undefined,
	prefersColorScheme: string,
	prefersReducedMotion: string,
): Promise<void> {
	if (bypassCsp) {
		await page.setBypassCSP(true);
	}

	page.emulateMediaFeatures([
		{ name: "prefers-color-scheme", value: prefersColorScheme },
		{ name: "prefers-reduced-motion", value: prefersReducedMotion },
	]);
}

/**
 * Setup request interception for wildcard URL blocking and resource-type blocking.
 */
export async function setupRequestBlocking(
	page: Page,
	blockRequests: string[] = [],
	blockResources: z.infer<typeof ResourceTypeSchema>[] = [],
): Promise<void> {
	if (!blockRequests.length && !blockResources.length) return;

	const blockRequest = wildcardMatch(blockRequests, { separator: false });
	await page.setRequestInterception(true);

	page.on("request", (request: HTTPRequest) => {
		if (blockResources.includes(request.resourceType() as never)) {
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

/**
 * Enable ad / tracker / cookie-banner blocking using Ghostery's filter lists.
 */
export async function setupAdAndTrackerBlocking(
	page: Page,
	{
		blockAds,
		blockCookieBanners,
		blockTrackers,
	}: { blockAds: boolean; blockCookieBanners: boolean; blockTrackers: boolean },
): Promise<void> {
	if (!blockAds && !blockCookieBanners && !blockTrackers) return;

	const lists: string[] = [];
	if (blockAds) lists.push(...adsLists);
	if (blockCookieBanners) {
		lists.push(
			"https://secure.fanboy.co.nz/fanboy-cookiemonster.txt",
			"https://secure.fanboy.co.nz/fanboy-annoyance.txt",
		);
	}
	if (blockTrackers) lists.push(...adsAndTrackingLists);

	if (!lists.length) return;

	const blocker = await PuppeteerBlocker.fromLists(fetch, lists);
	await blocker.enableBlockingInPage(page);
}

/**
 * Perform a smooth full-page scroll to trigger lazy-loading elements.
 */
export async function performFullPageScroll(
	page: Page,
	scrollDuration: number,
): Promise<void> {
	await page.evaluate(async (duration: number) => {
		// Ensure a valid positive duration to avoid division by zero or NaN during progress calculation
		const safeDuration =
			typeof duration !== "number" ||
			!Number.isFinite(duration) ||
			duration <= 0
				? 1
				: duration;
		const wait = (ms: number) =>
			new Promise<void>((resolve) => setTimeout(resolve, ms));

		const pageHeight = Math.max(
			document.body.scrollHeight,
			document.documentElement.scrollHeight,
			document.body.offsetHeight,
			document.documentElement.offsetHeight,
			document.body.clientHeight,
			document.documentElement.clientHeight,
		);

		const viewportHeight = window.innerHeight;
		const totalScroll = Math.max(0, pageHeight - viewportHeight);
		// Guard against zero-division and ensure at least one animation frame
		const steps = Math.max(1, Math.floor(totalScroll / viewportHeight));

		window.scrollTo(0, 0);
		await wait(100);

		// Smoothly scroll to bottom over the provided duration using rAF
		await new Promise<void>((resolveScroll) => {
			const startTime = performance.now();
			let lastStep = 0;
			const step = () => {
				const elapsed = performance.now() - startTime;
				const progress = Math.min(elapsed / safeDuration, 1);

				const currentStep = Math.floor(progress * steps);
				if (currentStep !== lastStep) {
					window.scrollTo(0, currentStep * viewportHeight);
					lastStep = currentStep;
				}

				if (progress < 1) {
					requestAnimationFrame(step);
				} else {
					resolveScroll();
				}
			};
			requestAnimationFrame(step);
		});

		// Ensure we reach the bottom and allow lazy content to load
		window.scrollTo(0, pageHeight);
		await wait(300);

		window.scrollTo(0, 0);
		await wait(300);

		// Wait for all images to load
		const images = Array.from(document.querySelectorAll("img"));
		await Promise.all(
			images.map((img) => {
				if (img.complete && img.naturalHeight !== 0) {
					return Promise.resolve();
				}
				return new Promise((resolve) => {
					const timeout = setTimeout(() => {
						resolve(undefined);
					}, 5000);

					img.onload = () => {
						clearTimeout(timeout);
						resolve(undefined);
					};
					img.onerror = () => {
						clearTimeout(timeout);
						resolve(undefined);
					};
				});
			}),
		);
	}, scrollDuration);
}
