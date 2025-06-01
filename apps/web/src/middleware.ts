import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

import { authStateFn } from "./actions/get-auth-state.ts";

export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		try {
			const auth = await authStateFn();

			if (!auth) {
				throw redirect({
					to: "/login",
				});
			}

			return next({
				context: {
					...auth,
				} as const,
			});
		} catch (error) {
			console.error("Authentication error:", error);

			if (
				error instanceof Error &&
				(error.message.includes("No request found") ||
					error.name === "NoRequestError")
			) {
				throw error;
			}

			throw redirect({
				to: "/login",
			});
		}
	},
);
