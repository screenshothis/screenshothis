import { useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/page-header.tsx";
import * as Avatar from "#/components/ui/avatar.tsx";
import * as LinkButton from "#/components/ui/link-button.tsx";
import * as ProgressBar from "#/components/ui/progress-bar.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { useTRPC } from "#/utils/trpc.ts";

export const Route = createFileRoute("/_app/dashboard")({
	loader: async ({ context: { trpc, queryClient } }) => {
		await queryClient.prefetchQuery(trpc.me.queryOptions());
		return;
	},
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
				<div className="w-full max-w-96">
					<div className="space-y-1.5">
						<div className="flex justify-between gap-1.5">
							<span className="text-label-sm">
								Usage (
								{(data?.currentWorkspace?.usage?.totalRequests ?? 0) -
									(data?.currentWorkspace?.usage?.remainingRequests ?? 0)}
								/{data?.currentWorkspace?.usage?.totalRequests ?? 0})
							</span>
							<span className="text-(--text-sub-600) text-paragraph-xs">
								{(((data?.currentWorkspace?.usage?.totalRequests ?? 0) -
									(data?.currentWorkspace?.usage?.remainingRequests ?? 0)) /
									(data?.currentWorkspace?.usage?.totalRequests ?? 0)) *
									100 || 0}
								%
							</span>
						</div>
						<ProgressBar.Root
							value={
								data?.currentWorkspace?.usage?.totalRequests
									? ((data.currentWorkspace.usage.totalRequests -
											(data.currentWorkspace.usage.remainingRequests ?? 0)) /
											data.currentWorkspace.usage.totalRequests) *
										100
									: 0
							}
							max={100}
						/>
						<div className="text-(--text-sub-600) text-paragraph-xs">
							<LinkButton.Root $style="primary" $size="sm" $underline>
								Upgrade
							</LinkButton.Root>{" "}
							to unlock more screenshots.
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
