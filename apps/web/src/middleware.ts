import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

import { authStateFn } from "./routes/__root.tsx";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
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
			},
		});
	} catch (error) {
		console.error("Authentication error:", error);
		throw redirect({
			to: "/login",
		});
	}
});
