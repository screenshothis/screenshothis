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
import { env } from "./env";

const pendingRequests = new Map<
	string,
	{ promise: Promise<unknown>; timestamp: number }
>();

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
			const data = (await existingRequest.promise) as T;
			return { data, wasDeduplicated: true };
		} catch (error) {
			pendingRequests.delete(key);
			throw error;
		}
	}

	const promise = generator();
	pendingRequests.set(key, { promise, timestamp: Date.now() });

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
export function cleanupStaleRequests(
	maxAgeMs = env.DEDUPLICATION_MAX_AGE_MS,
): void {
	const now = Date.now();
	const entries = Array.from(pendingRequests.entries());

	for (const [key, { timestamp }] of entries) {
		const age = now - timestamp;
		if (age > maxAgeMs) {
			pendingRequests.delete(key);
			logger.warn(
				{ key, age, maxAgeMs },
				"Cleaned up stale request that exceeded maximum age",
			);
		}
	}
}

// Configurable automatic cleanup - can be disabled via environment variable
if (env.DEDUPLICATION_CLEANUP_ENABLED) {
	setInterval(cleanupStaleRequests, env.DEDUPLICATION_CLEANUP_INTERVAL_MS);
	logger.info(
		{
			enabled: env.DEDUPLICATION_CLEANUP_ENABLED,
			intervalMs: env.DEDUPLICATION_CLEANUP_INTERVAL_MS,
			maxAgeMs: env.DEDUPLICATION_MAX_AGE_MS,
		},
		"Deduplication automatic cleanup enabled",
	);
} else {
	logger.info("Deduplication automatic cleanup disabled");
}
