import { useRouteContext } from "@tanstack/react-router";

export function useMe() {
	const { session } = useRouteContext({
		from: "__root__",
	});

	return session;
}
