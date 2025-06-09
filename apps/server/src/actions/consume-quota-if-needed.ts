import type { Context } from "hono";
import { endTime, setMetric, startTime } from "hono/timing";

import { logger } from "../lib/logger";
import { consumeQuota } from "../lib/request-quota";
import type { ScreenshotJobParams } from "../lib/screenshot-queue";
import type { retrieveScreenshot } from "./retrieve-screenshot";

type ScreenshotParams = ScreenshotJobParams["params"];

export async function consumeQuotaIfNeeded(
	c: Context,
	retrieval: Awaited<ReturnType<typeof retrieveScreenshot>>,
	userId: string,
	workspaceId: string,
	queryParams: ScreenshotParams,
	headers: Headers,
) {
	if (retrieval.result.data.created && !retrieval.result.wasDeduplicated) {
		startTime(c, "quota-consume");

		try {
			const quota = await consumeQuota(userId, {
				workspaceId,
				url: queryParams.url,
				format: queryParams.format,
				userAgent: queryParams.userAgent,
				source: "rest-optimized",
			});

			headers.set("X-Remaining-Requests", String(quota.remaining));

			if (quota.nextRefillAt) {
				headers.set("X-Refill-At", String(quota.nextRefillAt.getTime()));
			}
		} catch (error) {
			setMetric(c, "quota-consume-failed", 1);

			logger.error({ err: error }, "Failed to consume quota");
		}

		endTime(c, "quota-consume");
	}
}
