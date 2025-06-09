import type { Context } from "hono";
import { endTime, setMetric, startTime } from "hono/timing";

import { auth } from "../lib/auth";
import { logger } from "../lib/logger";
import type { ScreenshotJobParams } from "../lib/screenshot-queue";

type ScreenshotParams = ScreenshotJobParams["params"];

export async function authenticateAndValidateScreenshot(
	c: Context,
	queryParams: ScreenshotParams,
) {
	// Authentication
	startTime(c, "auth-check");
	const { valid, key } = await auth.api.verifyApiKey({
		body: { key: queryParams.apiKey },
	});
	endTime(c, "auth-check");

	if (!valid || !key || !key.metadata?.workspaceId || !key.userId) {
		setMetric(c, "auth-failed", 1);
		return c.json({ error: "Unauthorized" }, 401);
	}

	// Query params & normalization
	const workspaceId = key.metadata.workspaceId;
	const userId = key.userId;

	let normalizedUrl: string;
	try {
		normalizedUrl = new URL(queryParams.url).toString();
	} catch (urlError) {
		setMetric(c, "invalid-url", 1);
		logger.warn(
			{
				url: queryParams.url,
				workspaceId,
				error: urlError instanceof Error ? urlError.message : "Unknown error",
			},
			"Invalid URL provided in screenshot request",
		);
		return c.json(
			{
				error: "Invalid URL format. Please provide a valid HTTP or HTTPS URL.",
				code: "INVALID_URL",
			},
			400,
		);
	}

	const transformedParams: ScreenshotParams = {
		...queryParams,
		url: normalizedUrl,
		selector: queryParams.selector?.trim() || undefined,
	};

	return { workspaceId, userId, transformedParams };
}
