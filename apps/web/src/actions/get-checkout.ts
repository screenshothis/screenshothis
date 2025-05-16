import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { polar } from "#/lib/polar.ts";

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
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);

		try {
			const checkout = await polar.checkouts.get(
				{
					id: data.checkoutId,
				},
				{
					signal: controller.signal,
				},
			);

			clearTimeout(timeoutId);

			return checkout;
		} catch (error) {
			clearTimeout(timeoutId);
			console.error("Failed to fetch checkout:", error);

			if (error instanceof Error && error.name === "AbortError") {
				throw new Error("Request timed out. Please try again later.");
			}

			if (error instanceof Response && error.status === 404) {
				throw new Error(
					"Checkout not found. Please check the ID and try again.",
				);
			}

			throw new Error(
				"Failed to fetch checkout details. Please try again later.",
			);
		}
	});
