import type {
	PrefersColorSchemeSchema,
	PrefersReducedMotionSchema,
	ResourceTypeSchema,
} from "@screenshothis/schemas/screenshots";
import type { Context } from "hono";
import { setMetric } from "hono/timing";
import type { CookieSameSite } from "puppeteer";
import type { z } from "zod";

import { logger } from "../lib/logger";

const pendingRequests = new Map<string, Promise<unknown>>();

interface ScreenshotParams {
	url: string;
	selector?: string;
	width: number;
	height: number;
	isMobile?: boolean;
	isLandscape?: boolean;
	hasTouch?: boolean;
	deviceScaleFactor?: number;
	format: string;
	quality?: number;
	blockAds?: boolean;
	blockCookieBanners?: boolean;
	blockTrackers?: boolean;
	blockRequests?: Array<string>;
	blockResources?: Array<z.infer<typeof ResourceTypeSchema>>;
	prefersColorScheme?: z.infer<typeof PrefersColorSchemeSchema>;
	prefersReducedMotion?: z.infer<typeof PrefersReducedMotionSchema>;
	isCached?: boolean;
	cacheTtl?: number;
	cacheKey?: string;
	userAgent?: string;
	headers?: Array<{ name: string; value: string }>;
	cookies?: Array<{
		name: string;
		value: string;
		domain?: string;
		path?: string;
		expires?: number;
		sameSite?: CookieSameSite | undefined;
		secure?: boolean;
		httpOnly?: boolean;
	}>;
	bypassCsp?: boolean;
}

/**
 * Generate a cache key for screenshot parameters
 */
export function generateCacheKey(
	workspaceId: string,
	params: ScreenshotParams,
): string {
	const normalizedParams = {
		url: params.url,
		selector: params.selector || null,
		width: params.width,
		height: params.height,
		isMobile: params.isMobile || false,
		isLandscape: params.isLandscape || false,
		hasTouch: params.hasTouch || false,
		deviceScaleFactor: params.deviceScaleFactor || 1,
		format: params.format,
		quality: params.quality || 80,
		blockAds: params.blockAds || false,
		blockCookieBanners: params.blockCookieBanners || false,
		blockTrackers: params.blockTrackers || false,
		blockRequests: (params.blockRequests || []).sort(),
		blockResources: (params.blockResources || []).sort(),
		prefersColorScheme: params.prefersColorScheme || "light",
		prefersReducedMotion: params.prefersReducedMotion || "no-preference",
		isCached: params.isCached || false,
		cacheTtl: params.cacheTtl || null,
		cacheKey: params.cacheKey || null,
		userAgent: params.userAgent || null,
		headers: (params.headers || [])
			.map((h) => ({ name: h.name, value: h.value }))
			.sort((a, b) => a.name.localeCompare(b.name)),
		cookies: (params.cookies || [])
			.map((c) => ({
				name: c.name,
				value: c.value,
				domain: c.domain || null,
				path: c.path || null,
				expires: c.expires || null,
				sameSite: c.sameSite || null,
				secure: c.secure || false,
				httpOnly: c.httpOnly || false,
			}))
			.sort((a, b) => a.name.localeCompare(b.name)),
		bypassCsp: params.bypassCsp || false,
	};

	const paramsString = JSON.stringify(
		normalizedParams,
		Object.keys(normalizedParams).sort(),
	);
	const hash = Bun.hash(paramsString).toString(16);

	return `${workspaceId}-${hash}`;
}

/**
 * Deduplicate screenshot requests to avoid processing the same URL multiple times
 */
export async function deduplicateRequest<T>(
	key: string,
	generator: () => Promise<T>,
	context?: Context,
): Promise<{ data: T; wasDeduplicated: boolean }> {
	const existingRequest = pendingRequests.get(key);
	if (existingRequest) {
		logger.info(
			{ key },
			"Request deduplicated - using existing pending request",
		);

		if (context) {
			setMetric(context, "request-deduplicated", 1);
		}

		try {
			const data = (await existingRequest) as T;
			return { data, wasDeduplicated: true };
		} catch (error) {
			pendingRequests.delete(key);
			throw error;
		}
	}

	const promise = generator();
	pendingRequests.set(key, promise);

	if (context) {
		setMetric(context, "request-new", 1);
	}

	try {
		const data = await promise;
		return { data, wasDeduplicated: false };
	} catch (error) {
		logger.error({ err: error, key }, "Request failed");
		throw error;
	} finally {
		pendingRequests.delete(key);
	}
}

/**
 * Get the number of pending requests (for monitoring)
 */
export function getPendingRequestCount(): number {
	return pendingRequests.size;
}

/**
 * Clear all pending requests (useful for testing or emergency cleanup)
 */
export function clearPendingRequests(): void {
	pendingRequests.clear();
}

/**
 * Clean up requests that have been pending for too long
 */
export function cleanupStaleRequests(maxAgeMs = 300000): void {
	const promises = Array.from(pendingRequests.entries());

	for (const [key, promise] of promises) {
		Promise.race([
			promise,
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error("Cleanup timeout")), 100),
			),
		]).catch(() => {
			pendingRequests.delete(key);
			logger.warn({ key }, "Cleaned up potentially stale request");
		});
	}
}

setInterval(cleanupStaleRequests, 60000);
