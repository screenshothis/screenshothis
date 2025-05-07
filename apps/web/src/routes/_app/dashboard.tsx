import { useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/page-header.tsx";
import * as Avatar from "#/components/ui/avatar.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { useTRPC } from "#/utils/trpc.ts";

export const Route = createFileRoute("/_app/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	const trpc = useTRPC();
	const { user } = useUser();
	const { data } = useQuery(trpc.me.queryOptions());

	return (
		<>
			<PageHeader
				icon={
					user ? (
						<Avatar.Root $size="48">
							{user?.imageUrl ? (
								<Avatar.Image src={user.imageUrl} alt={user.fullName ?? ""} />
							) : null}
						</Avatar.Root>
					) : (
						<Skeleton className="size-12 rounded-full" />
					)
				}
				title={user?.fullName ?? <Skeleton className="h-6" />}
				description="Welcome back to ScreenshoThis 👋🏻"
			/>

			<div className="flex flex-col gap-6 overflow-hidden px-4 pb-6 lg:px-8 lg:pt-1">
				<h1>Dashboard</h1>
				<p>Welcome {user?.fullName}</p>
				<p>
					Workspace: {data?.currentWorkspace.name} -{" "}
					{data?.currentWorkspace.usage.remainingRequests}/{" "}
					{data?.currentWorkspace.usage.totalRequests}
				</p>
			</div>
		</>
	);
}
