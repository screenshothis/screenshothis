import { useRouteContext } from "@tanstack/react-router";
import type { Session, User } from "better-auth/types";

export function useMe(): (Session & { user: User }) | null {
	const { session } = useRouteContext({
		from: "__root__",
	});

	return session;
}
