import type { PlanType } from "@screenshothis/schemas/plan";

import { env } from "#/utils/env";

export async function getProductSlugById(id: string): Promise<PlanType> {
	switch (id) {
		case env.POLAR_LITE_PRODUCT_ID:
			return "lite";
		case env.POLAR_PRO_PRODUCT_ID:
			return "pro";
		default:
			throw new Error(`Unknown product ID: ${id}`);
	}
}
