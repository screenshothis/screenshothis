import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DashedDivider } from "#/components/dashed-divider.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { TotalScreenshots } from "#/components/total-screenshots.tsx";
import * as Avatar from "#/components/ui/avatar.tsx";
import * as Divider from "#/components/ui/divider.tsx";
import * as LinkButton from "#/components/ui/link-button.tsx";
import * as ProgressBar from "#/components/ui/progress-bar.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { DashboardSearchSchema } from "#/schemas/dashboard.ts";
import { useORPC } from "#/utils/orpc.ts";

export const Route = createFileRoute("/_app/dashboard")({
	// TODO: figure it out a wait to getQueryData passing the auth user
	loader: async ({ context: { orpc, queryClient } }) => {
		await queryClient.prefetchQuery(orpc.me.queryOptions());
		await queryClient.prefetchQuery(
			orpc.stats.queryOptions({ input: { range: "30d" } }),
		);
		return;
	},
	validateSearch: (search) => DashboardSearchSchema.parse(search),
	component: RouteComponent,
});

function RouteComponent() {
	const { range } = Route.useSearch();
	const orpc = useORPC();
	const [{ data: me }, { data: stats }] = useQueries({
		queries: [
			orpc.me.queryOptions(),
			orpc.stats.queryOptions({ input: { range } }),
		],
	});

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

			<div className="px-4 lg:px-8">
				<Divider.Root />
			</div>

			<div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8 min-[1100px]:flex-row">
				<div className="min-w-0 flex-1">
					<div className="grid grid-cols-2 gap-4 pb-6">
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

					<DashedDivider />

					<div className="mt-6">
						{stats ? (
							<TotalScreenshots data={stats.data} range={range} />
						) : (
							<Skeleton className="h-67" />
						)}
					</div>
				</div>
			</div>
		</>
	);
}
