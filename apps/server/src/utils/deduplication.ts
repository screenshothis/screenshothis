import crypto from "node:crypto";

import type { CreateScreenshotSchema } from "@screenshothis/schemas/screenshots";
import type { Context } from "hono";
import { setMetric } from "hono/timing";
import type { z } from "zod";

import type { ObjectToCamel } from "ts-case-convert";
import { logger } from "../lib/logger";
import { env } from "./env";

const pendingRequests = new Map<
	string,
	{ promise: Promise<unknown>; timestamp: number }
>();

/**
 * Generate a cache key for screenshot parameters
 */
export function generateCacheKey(
	workspaceId: string,
	params: ObjectToCamel<z.infer<typeof CreateScreenshotSchema>>,
): string {
	// Normalize headers/cookies for deterministic key generation
	const normalizedHeaders =
		params.headers?.map((h) => ({
			name: h.name?.toLowerCase() || "",
			value: h.value || "",
		})) || [];

	const normalizedCookies =
		params.cookies?.map((c) => ({
			name: c.name || "",
			value: c.value || "",
			domain: c.domain || "",
			path: c.path || "",
			expires: c.expires || 0,
			sameSite: c.sameSite || "",
			secure: c.secure || false,
			httpOnly: c.httpOnly || false,
		})) || [];

	const normalizedParams = {
		...params,
		headers: normalizedHeaders,
		cookies: normalizedCookies,
	};

	const paramsString = JSON.stringify(
		normalizedParams,
		Object.keys(normalizedParams).sort(),
	);
	const hash = crypto.createHash("sha256");
	hash.update(paramsString);
	const hashHex = hash.digest("hex");

	return `${workspaceId}-${hashHex}`;
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

		const data = (await existingRequest.promise) as T;
		return { data, wasDeduplicated: true };
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
