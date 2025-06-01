import { EventEmitter } from "node:events";

import { eq, sql } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";

export class RequestQuotaError extends Error {
	constructor(readonly type: "NOT_FOUND" | "EXCEEDED") {
		super(type);
		this.name = "RequestQuotaError";
	}
}

interface LimitRow {
	remainingRequests: number | null;
	refillAmount: number | null;
	refillInterval: bigint | null;
	refilledAt: Date | null;
	createdAt: Date; // from timestamps util
	totalAllowedRequests: number | null;
}

async function maybeRefill(userId: string) {
	const limit = await db.query.requestLimits.findFirst({
		where: eq(schema.requestLimits.userId, userId),
		columns: {
			remainingRequests: true,
			refillAmount: true,
			refillInterval: true,
			refilledAt: true,
			totalAllowedRequests: true,
			createdAt: true,
		},
	});

	if (!limit) return null;

	// Only attempt refill when no remaining requests and refill config exists
	if (
		(limit.remainingRequests ?? 0) > 0 ||
		limit.refillAmount == null ||
		limit.refillInterval == null ||
		limit.refillInterval === BigInt(0)
	) {
		return limit;
	}

	const lastRefill = limit.refilledAt ?? limit.createdAt;
	const intervalMs = Number(limit.refillInterval);
	if (Date.now() - lastRefill.getTime() < intervalMs) {
		return limit as LimitRow;
	}

	const newRemaining = Math.min(
		(limit.totalAllowedRequests ?? limit.refillAmount) as number,
		Math.max(0, limit.remainingRequests ?? 0) + (limit.refillAmount as number),
	);

	const [updated] = await db
		.update(schema.requestLimits)
		.set({
			remainingRequests: newRemaining,
			refilledAt: new Date(),
		})
		.where(eq(schema.requestLimits.userId, userId))
		.returning({
			remainingRequests: schema.requestLimits.remainingRequests,
			refillAmount: schema.requestLimits.refillAmount,
			refillInterval: schema.requestLimits.refillInterval,
			refilledAt: schema.requestLimits.refilledAt,
			createdAt: schema.requestLimits.createdAt,
			totalAllowedRequests: schema.requestLimits.totalAllowedRequests,
		});

	// Emit refill event so external observers can track quota resets
	const refillDelta = newRemaining - (limit.remainingRequests ?? 0);
	quotaEvents.emit("refill", {
		userId,
		amount: refillDelta,
		remaining: newRemaining,
	} as QuotaRefillEvent);

	return updated;
}

/**
 * Checks if the user has any remaining requests.
 *
 * @throws RequestQuotaError when the limit is not found or exhausted.
 *
 * @returns current remaining requests (without consuming).
 */
export async function assertQuotaAvailable(userId: string): Promise<number> {
	const limit = await maybeRefill(userId);

	if (!limit || limit.remainingRequests == null) {
		throw new RequestQuotaError("NOT_FOUND");
	}

	if (limit.remainingRequests <= 0) {
		throw new RequestQuotaError("EXCEEDED");
	}

	return limit.remainingRequests;
}

export interface QuotaResult {
	remaining: number;
	nextRefillAt: Date | null;
}

/**
 * Returns quota info without consuming.
 */
export async function getQuota(userId: string): Promise<QuotaResult> {
	const limit = await maybeRefill(userId);

	if (!limit || limit.remainingRequests == null) {
		throw new RequestQuotaError("NOT_FOUND");
	}

	const lastRefill = (limit.refilledAt ?? limit.createdAt) as Date;
	const intervalMs = Number(limit.refillInterval ?? BigInt(0));
	const nextRefillAt =
		intervalMs > 0 ? new Date(lastRefill.getTime() + intervalMs) : null;

	return { remaining: limit.remainingRequests, nextRefillAt };
}

export async function consumeQuota(userId: string): Promise<QuotaResult> {
	const query = sql`
		UPDATE request_limits
		SET
			total_requests = total_requests + 1,
			remaining_requests = CASE
				WHEN remaining_requests > 0 THEN remaining_requests - 1
				WHEN remaining_requests <= 0
					 AND refill_amount IS NOT NULL
					 AND refill_interval IS NOT NULL
					 AND (extract(epoch from now()) * 1000 - extract(epoch from coalesce(refilled_at, created_at)) * 1000) >= refill_interval
				THEN LEAST(
						coalesce(total_allowed_requests, refill_amount),
						remaining_requests + refill_amount
					) - 1
				ELSE remaining_requests
			END,
			refilled_at = CASE
				WHEN remaining_requests <= 0
					 AND refill_amount IS NOT NULL
					 AND refill_interval IS NOT NULL
					 AND (extract(epoch from now()) * 1000 - extract(epoch from coalesce(refilled_at, created_at)) * 1000) >= refill_interval
				THEN now()
				ELSE refilled_at
			END
		WHERE user_id = ${userId}
		  AND (
				remaining_requests > 0 OR (
					remaining_requests <= 0
					AND refill_amount IS NOT NULL
					AND refill_interval IS NOT NULL
					AND (extract(epoch from now()) * 1000 - extract(epoch from coalesce(refilled_at, created_at)) * 1000) >= refill_interval
				)
			)
		RETURNING remaining_requests, refill_interval, refilled_at, created_at;
	`;

	const result = await db.execute(query);

	const rows = result.rows as Array<{
		remaining_requests: number;
		refill_interval: string | null;
		refilled_at: Date;
		created_at: Date;
	}>;

	if (rows.length === 0) {
		throw new RequestQuotaError("EXCEEDED");
	}

	const row = rows[0];

	const lastRefillRaw = row.refilled_at ?? row.created_at;
	const lastRefill =
		lastRefillRaw instanceof Date ? lastRefillRaw : new Date(lastRefillRaw);
	const intervalMs = Number(row.refill_interval ?? "0");
	const nextRefillAt =
		intervalMs > 0 ? new Date(lastRefill.getTime() + intervalMs) : null;

	quotaEvents.emit("consume", {
		userId,
		remaining: row.remaining_requests,
	} as QuotaConsumeEvent);

	return {
		remaining: row.remaining_requests,
		nextRefillAt,
	};
}

// ---------------------------------------------
// Public events
// ---------------------------------------------

export interface QuotaConsumeEvent {
	userId: string;
	remaining: number;
}

export interface QuotaRefillEvent {
	userId: string;
	amount: number;
	remaining: number;
}

export const quotaEvents = new EventEmitter();
