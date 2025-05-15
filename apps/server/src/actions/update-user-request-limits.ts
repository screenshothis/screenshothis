import { keyLimits } from "@screenshothis/common/keys";
import type { PlanType } from "@screenshothis/schemas/plan";
import { eq } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";

export async function updateUserRequestLimits(userId: string, plan: PlanType) {
	const limits = keyLimits[plan].metadata;

	await db
		.update(schema.requestLimits)
		.set({
			totalAllowedRequests: limits.totalAllowedRequests,
			remainingRequests: limits.totalAllowedRequests,
			plan,
			refillAmount: limits.refillAmount,
			isExtraEnabled: limits.isExtraEnabled,
		})
		.where(eq(schema.requestLimits.userId, userId));
}
