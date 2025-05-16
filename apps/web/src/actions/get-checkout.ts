import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { polar } from "#/lib/polar.ts";

export async function getCheckout(checkoutId: string) {
	try {
		const checkout = await polar.checkouts.get({
			id: checkoutId,
		});

		return checkout;
	} catch (error) {
		console.error("Failed to fetch checkout:", error);

		throw new Error(
			"Failed to fetch checkout details. Please try again later.",
		);
	}
}

export const getCheckoutServerFn = createServerFn({ method: "GET" })
	.validator(
		z.object({
			checkoutId: z
				.string()
				.min(1, "Checkout ID is required")
				.regex(/^[a-zA-Z0-9_-]+$/, "Invalid checkout ID format"),
		}),
	)
	.handler(async ({ data }) => {
		return getCheckout(data.checkoutId);
	});
