import type { Context } from "hono";
import { endTime, setMetric, startTime } from "hono/timing";

import { RequestQuotaError, assertQuotaAvailable } from "../lib/request-quota";

export class QuotaExceededError extends Error {
	constructor(type: "EXCEEDED" | "NOT_FOUND") {
		const message =
			type === "EXCEEDED"
				? "You have reached the maximum number of requests allowed for your current plan."
				: "Request limits not found for the current user";
		super(message);
		this.name = "QuotaExceededError";
	}
}

export async function ensureQuotaAvailableForUser(userId: string, c: Context) {
	startTime(c, "quota-check");

	try {
		await assertQuotaAvailable(userId);

		// Success - no return value needed
	} catch (error) {
		if (error instanceof RequestQuotaError) {
			setMetric(c, "quota-exceeded", 1);

			throw new QuotaExceededError(error.type);
		}

		throw error;
	} finally {
		endTime(c, "quota-check");
	}
}
