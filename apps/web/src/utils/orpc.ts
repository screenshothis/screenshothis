import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterUtils } from "@orpc/react-query";
import { createORPCReactQueryUtils } from "@orpc/react-query";
import type { RouterClient } from "@orpc/server";
import type { appRouter } from "@screenshothis/server/routers";
import { getHeaders } from "@tanstack/react-start/server";
import { createContext, use } from "react";

type ORPCReactUtils = RouterUtils<RouterClient<typeof appRouter>>;

export const link = new RPCLink({
	url: `${import.meta.env.VITE_SERVER_URL}/rpc`,
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include",
		});
	},
	headers: () => {
		if (typeof window === "undefined") {
			return getHeaders();
		}

		return {};
	},
});

export const client: RouterClient<typeof appRouter> = createORPCClient(link);

export const orpc = createORPCReactQueryUtils(client);

export const ORPCContext = createContext<ORPCReactUtils | undefined>(undefined);

export function useORPC(): ORPCReactUtils {
	const orpc = use(ORPCContext);
	if (!orpc) {
		throw new Error("ORPCContext is not set up properly");
	}
	return orpc;
}
