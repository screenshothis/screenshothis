import { Polar } from "@polar-sh/sdk";

import { env } from "../utils/env";

export const polarClient = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN,
	server: env.POLAR_SERVER,
});

export const polarProducts: Array<{
	productId: string;
	slug: string;
}> = [];

if (env.POLAR_LITE_PRODUCT_ID) {
	polarProducts.push({
		productId: env.POLAR_LITE_PRODUCT_ID,
		slug: "lite",
	});
}

if (env.POLAR_PRO_PRODUCT_ID) {
	polarProducts.push({
		productId: env.POLAR_PRO_PRODUCT_ID,
		slug: "pro",
	});
}

if (env.POLAR_ENTERPRISE_PRODUCT_ID) {
	polarProducts.push({
		productId: env.POLAR_ENTERPRISE_PRODUCT_ID,
		slug: "enterprise",
	});
}
