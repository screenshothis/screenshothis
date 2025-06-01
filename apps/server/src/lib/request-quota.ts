import { eq, sql } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";

export class RequestQuotaError extends Error {
	constructor(readonly type: "NOT_FOUND" | "EXCEEDED") {
		super(type);
		this.name = "RequestQuotaError";
	}
}

/**
 * Checks if the user has any remaining requests.
 *
 * @throws RequestQuotaError when the limit is not found or exhausted.
 *
 * @returns current remaining requests (without consuming).
 **/
export async function assertQuotaAvailable(userId: string): Promise<number> {
	const limit = await db.query.requestLimits.findFirst({
		where: eq(schema.requestLimits.userId, userId),
		columns: { remainingRequests: true },
	});

	if (!limit || limit.remainingRequests == null) {
		throw new RequestQuotaError("NOT_FOUND");
	}

	if (limit.remainingRequests <= 0) {
		throw new RequestQuotaError("EXCEEDED");
	}

	return limit.remainingRequests;
}

/**
 * Decrements the user remaining request counter by 1.
 *
 * @returns updated remaining requests after consumption.
 **/
export async function consumeQuota(userId: string): Promise<number> {
	const [updated] = await db
		.update(schema.requestLimits)
		.set({
			totalRequests: sql`${schema.requestLimits.totalRequests} + 1`,
			remainingRequests: sql`${schema.requestLimits.remainingRequests} - 1`,
		})
		.where(eq(schema.requestLimits.userId, userId))
		.returning({ remainingRequests: schema.requestLimits.remainingRequests });

	return updated?.remainingRequests ?? 0;
}
