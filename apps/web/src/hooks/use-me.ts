import { useQuery } from "@tanstack/react-query";

import { useORPC } from "./use-orpc.ts";

export function useMe() {
	const orpc = useORPC();
	const { data: me } = useQuery(orpc.users.me.queryOptions());

	return me;
}
