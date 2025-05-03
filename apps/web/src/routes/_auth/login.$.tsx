import { createFileRoute } from "@tanstack/react-router";

import { SignIn } from "@clerk/tanstack-react-start";

export const Route = createFileRoute("/_auth/login/$")({
	component: RouteComponent,
});

function RouteComponent() {
	return <SignIn />;
}
