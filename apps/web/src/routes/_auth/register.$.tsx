import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/register/$")({
	component: RouteComponent,
});

function RouteComponent() {
	return <SignUp />;
}
