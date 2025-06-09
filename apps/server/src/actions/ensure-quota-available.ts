import type { Context } from "hono";
import { endTime, setMetric, startTime } from "hono/timing";

import { RequestQuotaError, assertQuotaAvailable } from "../lib/request-quota";

export async function ensureQuotaAvailableForUser(userId: string, c: Context) {
	startTime(c, "quota-check");

	try {
		await assertQuotaAvailable(userId);

		return null; // Success case
	} catch (error) {
		if (error instanceof RequestQuotaError) {
			setMetric(c, "quota-exceeded", 1);

			return c.json(
				{
					error:
						error.type === "EXCEEDED"
							? "You have reached the maximum number of requests allowed for your current plan."
							: "Request limits not found for the current user",
				},
				403,
			);
		}

		throw error;
	} finally {
		endTime(c, "quota-check");
	}
}
