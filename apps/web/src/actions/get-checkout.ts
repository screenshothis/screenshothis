import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { polar } from "#/lib/polar.ts";

export async function getCheckout(checkoutId: string) {
	const checkout = await polar.checkouts.get({
		id: checkoutId,
	});

	return checkout;
}

export const getCheckoutServerFn = createServerFn({ method: "GET" })
	.validator(z.object({ checkoutId: z.string() }))
	.handler(async ({ data }) => {
		const checkout = await getCheckout(data.checkoutId);

		return checkout;
	});
