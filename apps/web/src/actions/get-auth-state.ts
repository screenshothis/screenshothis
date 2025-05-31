import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

import { authClient } from "#/lib/auth.ts";

export const authStateFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const request = getWebRequest();
		if (!request)
			throw new Error("No request found in current execution context");
		const { data } = await authClient.getSession({
			fetchOptions: {
				headers: {
					cookie: request.headers.get("cookie") || "",
				},
			},
		});

		return data;
	},
);
