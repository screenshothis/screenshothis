import { keyLimits } from "@screenshothis/common/keys";
import type { PlanType } from "@screenshothis/schemas/plan";
import { eq } from "drizzle-orm";

import { db } from "#/db";
import * as schema from "#/db/schema";

export async function updateUserRequestLimits(userId: string, plan: PlanType) {
	if (!keyLimits[plan]) {
		throw new Error(`Unknown plan: ${plan}`);
	}

	const { totalAllowedRequests, refillAmount, isExtraEnabled } =
		keyLimits[plan].metadata;

	await db
		.update(schema.requestLimits)
		.set({
			totalAllowedRequests,
			remainingRequests: totalAllowedRequests,
			plan,
			refillAmount,
			isExtraEnabled,
		})
		.where(eq(schema.requestLimits.userId, userId));
}
