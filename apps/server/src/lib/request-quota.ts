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
		(limit.remainingRequests ?? 0) + (limit.refillAmount as number),
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
	return await db.transaction(async (tx) => {
		// Lock the row so two concurrent requests can't both refill / consume simultaneously
		await tx.execute(
			sql`SELECT 1 FROM request_limits WHERE user_id = ${userId} FOR UPDATE`,
		);

		// Ensure refill if needed inside the same transaction
		await maybeRefill(userId);

		const [updated] = await tx
			.update(schema.requestLimits)
			.set({
				totalRequests: sql`${schema.requestLimits.totalRequests} + 1`,
				remainingRequests: sql`${schema.requestLimits.remainingRequests} - 1`,
			})
			.where(eq(schema.requestLimits.userId, userId))
			.returning({
				remainingRequests: schema.requestLimits.remainingRequests,
				refillInterval: schema.requestLimits.refillInterval,
				refilledAt: schema.requestLimits.refilledAt,
				createdAt: schema.requestLimits.createdAt,
			});

		const lastRefill = (updated.refilledAt ?? updated.createdAt) as Date;
		const intervalMs = Number(updated.refillInterval ?? BigInt(0));
		const nextRefillAt =
			intervalMs > 0 ? new Date(lastRefill.getTime() + intervalMs) : null;

		quotaEvents.emit("consume", {
			userId,
			remaining: updated.remainingRequests ?? 0,
		} as QuotaConsumeEvent);

		return {
			remaining: updated.remainingRequests ?? 0,
			nextRefillAt,
		};
	});
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
