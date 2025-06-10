import type { Context } from "hono";

import type { ScreenshotJobParams } from "../lib/screenshot-queue";
import { generateETag } from "../utils/etag";
import { consumeQuotaIfNeeded } from "./consume-quota-if-needed";
import type { retrieveScreenshot } from "./retrieve-screenshot";

type ScreenshotParams = ScreenshotJobParams["params"];

function setCDNCacheHeaders(
	headers: Headers,
	scenario: "success" | "placeholder" | "error",
	params: {
		cacheTtl?: number;
		format: string;
		cacheKey: string;
		isNewContent?: boolean;
		workspaceId: string;
		timestamp?: number;
		additionalEntropy?: {
			s3Key?: string;
			s3ETag?: string;
			fileSize?: number;
		};
	},
) {
	const {
		cacheTtl = 3600,
		format,
		cacheKey,
		isNewContent,
		workspaceId,
		timestamp,
		additionalEntropy,
	} = params;

	switch (scenario) {
		case "success": {
			// Conservative browser cache for new content (max 5min), full TTL for existing
			const browserTtl = isNewContent ? Math.min(cacheTtl, 300) : cacheTtl;
			headers.set(
				"Cache-Control",
				`public, max-age=${browserTtl}, stale-while-revalidate=${Math.floor(cacheTtl * 0.1)}`,
			);

			// Aggressive CDN caching: 2x longer with graceful degradation
			headers.set(
				"CDN-Cache-Control",
				`public, max-age=${cacheTtl * 2}, stale-while-revalidate=${cacheTtl}, stale-if-error=${cacheTtl * 24}`,
			);

			// Cloudflare cache tags for selective purging by workspace/format/type
			headers.set(
				"CF-Cache-Tag",
				`workspace:${workspaceId},format:${format},content:screenshot`,
			);
			headers.set("CF-Edge-Cache", "cache,platform=cf");

			// High-entropy ETag for precise cache invalidation
			headers.set(
				"ETag",
				generateETag(
					cacheKey,
					format,
					timestamp || Date.now(),
					additionalEntropy,
				),
			);

			break;
		}

		case "placeholder":
			// Short cache for placeholders to encourage retries when screenshot is ready
			headers.set("Cache-Control", "public, max-age=30, must-revalidate");
			headers.set(
				"CDN-Cache-Control",
				"public, max-age=60, stale-while-revalidate=30",
			);
			headers.set(
				"CF-Cache-Tag",
				`workspace:${workspaceId},content:placeholder`,
			);
			break;

		case "error":
			// Very short cache for errors, but allow stale content to maintain availability
			headers.set("Cache-Control", "public, max-age=10, must-revalidate");
			headers.set(
				"CDN-Cache-Control",
				"public, max-age=30, stale-if-error=300",
			);
			headers.set("CF-Cache-Tag", `workspace:${workspaceId},content:error`);
			break;
	}

	// Standard security and optimization headers
	headers.set("Vary", "Accept, Accept-Encoding, User-Agent");
	headers.set("X-Content-Type-Options", "nosniff");

	// CDN routing hints for global distribution
	headers.set("X-Edge-Location", "auto");
	headers.set("X-Cache-Regions", "global");

	// Compression hints for image formats that benefit from it
	if (format === "png" || format === "webp") {
		headers.set("X-Compress-Hint", "aggressive");
	}
}

export async function buildScreenshotResponse(
	c: Context,
	retrieval: Awaited<ReturnType<typeof retrieveScreenshot>>,
	queryParams: ScreenshotParams,
	cacheKey: string,
	workspaceId: string,
	userId: string,
) {
	const headers = new Headers();

	if (retrieval.retryAfter) {
		headers.set("Retry-After", retrieval.retryAfter);
	}

	// CDN / browser caching
	setCDNCacheHeaders(
		headers,
		retrieval.cacheScenario as "success" | "placeholder" | "error",
		{
			cacheTtl: queryParams.cacheTtl,
			format: queryParams.format,
			cacheKey,
			isNewContent: retrieval.result.data.created,
			workspaceId,
			timestamp: retrieval.screenshotTimestamp,
			additionalEntropy: retrieval.result.data.key
				? {
						s3Key: retrieval.result.data.key,
						s3ETag: retrieval.s3Metadata?.etag,
						fileSize: retrieval.s3Metadata?.size,
					}
				: undefined,
		},
	);

	// Quota consumption
	await consumeQuotaIfNeeded(
		c,
		retrieval,
		userId,
		workspaceId,
		queryParams,
		headers,
	);

	// Final headers
	if (!(retrieval.body instanceof ReadableStream)) {
		let byteLength: number;
		if (retrieval.body instanceof Buffer) {
			byteLength = retrieval.body.byteLength;
		} else if (retrieval.body instanceof ArrayBuffer) {
			byteLength = retrieval.body.byteLength;
		} else {
			// This should not happen based on the return types, but provide a fallback
			byteLength = 0;
		}
		headers.set("Content-Length", String(byteLength));
	}
	headers.set("Content-Type", retrieval.contentType);
	headers.set("Accept-Ranges", "bytes");
	headers.set(
		"Content-Disposition",
		`inline; filename="screenshot.${queryParams.format}"`,
	);
	headers.set(
		"X-Deduplicated",
		retrieval.result.wasDeduplicated ? "true" : "false",
	);
	headers.set("X-Cache-Key", cacheKey);
	headers.set(
		"X-Content-Fresh",
		retrieval.result.data.created ? "true" : "false",
	);
	headers.set("X-Cache-Scenario", retrieval.cacheScenario);
	headers.set("X-Robots-Tag", "noindex, nofollow");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

	if (retrieval.body === null) {
		throw new Error("Unexpected null body in buildScreenshotResponse");
	}

	return c.body(retrieval.body, { headers });
}
