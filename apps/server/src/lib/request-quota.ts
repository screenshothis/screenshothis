import { EventEmitter } from "node:events";

import { eq, sql } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { z } from "zod";

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
		WITH target AS (
			SELECT *,
				   (remaining_requests <= 0
					AND refill_amount IS NOT NULL
					AND refill_interval IS NOT NULL
					AND (extract(epoch from now()) * 1000 - extract(epoch from coalesce(refilled_at, created_at)) * 1000) >= refill_interval) AS can_refill
			FROM request_limits
			WHERE user_id = ${userId}
			FOR UPDATE
		)
		UPDATE request_limits AS rl
		SET total_requests = rl.total_requests + 1,
			remaining_requests = CASE
				WHEN target.remaining_requests > 0 THEN target.remaining_requests - 1
				WHEN target.can_refill THEN LEAST(coalesce(target.total_allowed_requests, target.refill_amount), target.remaining_requests + target.refill_amount) - 1
				ELSE target.remaining_requests
			END,
			refilled_at = CASE WHEN target.can_refill THEN now() ELSE target.refilled_at END
		FROM target
		WHERE rl.user_id = ${userId}
		RETURNING rl.remaining_requests, rl.refill_interval, rl.refilled_at, rl.created_at, rl.refill_amount, target.can_refill AS did_refill;
	`;

	const result = await db.execute(query);

	const RowSchema = z.object({
		remaining_requests: z.number(),
		refill_interval: z.string().nullable(),
		refilled_at: z.union([z.string(), z.date()]),
		created_at: z.union([z.string(), z.date()]),
		refill_amount: z.number().nullable(),
		did_refill: z.boolean(),
	});

	if (result.rowCount === 0) {
		throw new RequestQuotaError("EXCEEDED");
	}

	const parsed = RowSchema.parse(result.rows[0] as unknown);

	const row = {
		...parsed,
		// normalise dates
		refilled_at:
			parsed.refilled_at instanceof Date
				? parsed.refilled_at
				: new Date(parsed.refilled_at),
		created_at:
			parsed.created_at instanceof Date
				? parsed.created_at
				: new Date(parsed.created_at),
	};

	const lastRefill = row.refilled_at ?? row.created_at;
	const intervalMs = Number(row.refill_interval ?? "0");
	const nextRefillAt =
		intervalMs > 0 ? new Date(lastRefill.getTime() + intervalMs) : null;

	quotaEvents.emit("consume", {
		userId,
		remaining: row.remaining_requests,
	} as QuotaConsumeEvent);

	// Emit refill event if SQL flagged it
	if (row.did_refill) {
		const remainingBeforeConsume = row.remaining_requests + 1; // state right after refill but before current consumption
		quotaEvents.emit("refill", {
			userId,
			amount: row.refill_amount,
			remaining: remainingBeforeConsume,
		} as QuotaRefillEvent);
	}

	return {
		remaining: row.remaining_requests,
		nextRefillAt,
	};
}

export interface QuotaConsumeEvent {
	userId: string;
	remaining: number;
}

export interface QuotaRefillEvent {
	userId: string;
	amount: number;
	remaining: number;
}

interface QuotaEventMap {
	consume: QuotaConsumeEvent;
	refill: QuotaRefillEvent;
}

class TypedEventEmitter extends EventEmitter {
	emit<K extends keyof QuotaEventMap>(
		event: K,
		data: QuotaEventMap[K],
	): boolean {
		return super.emit(event, data);
	}

	on<K extends keyof QuotaEventMap>(
		event: K,
		listener: (data: QuotaEventMap[K]) => void,
	): this {
		return super.on(event, listener);
	}
}

export const quotaEvents = new TypedEventEmitter();
