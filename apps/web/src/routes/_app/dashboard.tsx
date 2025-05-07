import { useQueries } from "@tanstack/react-query";
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
		await queryClient.prefetchQuery(trpc.stats.queryOptions({ range: "30d" }));
		return;
	},
	component: RouteComponent,
});

function RouteComponent() {
	const trpc = useTRPC();
	const [{ data: me }, { data: stats }] = useQueries({
		queries: [
			trpc.me.queryOptions(),
			trpc.stats.queryOptions({ range: "30d" }),
		],
	});

	// TODO: Add a chart for the stats
	console.log(stats);

	return (
		<>
			<PageHeader
				icon={
					me ? (
						<Avatar.Root $size="48">
							{me?.imageUrl ? (
								<Avatar.Image src={me.imageUrl} alt={me.fullName ?? ""} />
							) : null}
						</Avatar.Root>
					) : (
						<Skeleton className="size-12 rounded-full" />
					)
				}
				title={me?.fullName ?? <Skeleton className="h-6" />}
				description="Welcome back to ScreenshoThis 👋🏻"
			/>

			<div className="flex flex-col gap-6 overflow-hidden px-4 pb-6 lg:px-8 lg:pt-1">
				<div className="grid grid-cols-2 gap-8">
					<div className="w-full">
						<div className="space-y-1.5">
							<div className="flex justify-between gap-1.5">
								<span className="text-label-sm">
									Usage (
									{(me?.currentWorkspace?.usage?.totalRequests ?? 0) -
										(me?.currentWorkspace?.usage?.remainingRequests ?? 0)}
									/{me?.currentWorkspace?.usage?.totalRequests ?? 0})
								</span>
								<span className="text-(--text-sub-600) text-paragraph-xs">
									{(((me?.currentWorkspace?.usage?.totalRequests ?? 0) -
										(me?.currentWorkspace?.usage?.remainingRequests ?? 0)) /
										(me?.currentWorkspace?.usage?.totalRequests ?? 0)) *
										100 || 0}
									%
								</span>
							</div>
							<ProgressBar.Root
								value={
									me?.currentWorkspace?.usage?.totalRequests
										? ((me.currentWorkspace.usage.totalRequests -
												(me.currentWorkspace.usage.remainingRequests ?? 0)) /
												me.currentWorkspace.usage.totalRequests) *
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
			</div>
		</>
	);
}
