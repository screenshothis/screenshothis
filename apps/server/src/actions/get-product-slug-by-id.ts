import type { PlanType } from "@screenshothis/schemas/plan";

import { env } from "#/utils/env";

export async function getProductSlugById(productId: string): Promise<PlanType> {
	switch (productId) {
		case env.POLAR_LITE_PRODUCT_ID:
			return "lite";
		case env.POLAR_PRO_PRODUCT_ID:
			return "pro";
		case env.POLAR_ENTERPRISE_PRODUCT_ID:
			return "enterprise";
		default:
			throw new Error(`Unknown product ID: ${productId}`);
	}
}
