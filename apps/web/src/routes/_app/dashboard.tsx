import { useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/page-header.tsx";
import * as Avatar from "#/components/ui/avatar.tsx";
import { useTRPC } from "#/utils/trpc.ts";

export const Route = createFileRoute("/_app/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	const trpc = useTRPC();
	const { user } = useUser();

	const privateData = useQuery(trpc.privateData.queryOptions());

	return (
		<>
			<PageHeader
				icon={
					<Avatar.Root $size="48">
						{user?.imageUrl ? (
							<Avatar.Image
								src={`${user.imageUrl}?width=48&height=48`}
								alt={user.fullName ?? ""}
							/>
						) : null}
					</Avatar.Root>
				}
				title={user?.fullName ?? "Placeholder"}
				description="Welcome back to ScreenshoThis 👋🏻"
			/>

			<div className="flex flex-col gap-6 overflow-hidden px-4 pb-6 lg:px-8 lg:pt-1">
				<h1>Dashboard</h1>
				<p>Welcome {user?.fullName}</p>
				<p>privateData: {privateData.data?.message}</p>
			</div>
		</>
	);
}
