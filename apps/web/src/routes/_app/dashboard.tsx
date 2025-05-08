import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";

import { CodeBlock } from "#/components/code-block.tsx";
import { DashedDivider } from "#/components/dashed-divider.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { TotalScreenshots } from "#/components/total-screenshots.tsx";
import * as Avatar from "#/components/ui/avatar.tsx";
import * as Divider from "#/components/ui/divider.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { UsageWidget } from "#/components/widgets/usage-widget.tsx";
import { DashboardSearchSchema } from "#/schemas/dashboard.ts";
import { useORPC } from "#/utils/orpc.ts";

export const Route = createFileRoute("/_app/dashboard")({
	// TODO: figure it out how to queryClient.ensureQueryData passing the auth user
	loader: async ({ context: { orpc, queryClient } }) => {
		await queryClient.prefetchQuery(orpc.me.queryOptions());
		await queryClient.prefetchQuery(
			orpc.stats.queryOptions({
				input: { range: "30d" },
			}),
		);
		return;
	},
	validateSearch: zodValidator(DashboardSearchSchema),
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
					<div className="mb-6">
						{stats ? (
							<TotalScreenshots data={stats.data} range={range} />
						) : (
							<Skeleton className="h-67" />
						)}
					</div>

					<div className="my-8">
						<DashedDivider />
					</div>
				</div>

				<div className="w-px bg-(--stroke-soft-200) lg:block" />

				<div className="shrink-0 min-[1100px]:w-[328px]">
					<UsageWidget
						totalRequests={me?.currentWorkspace?.usage?.totalRequests}
						remainingRequests={me?.currentWorkspace?.usage?.remainingRequests}
						className="px-1"
					/>

					<div className="mt-8">
						<CodeBlock
							wrapperClassName="rounded-16"
							isCopyable
							title="API Key"
							lang="bash"
							textToCopy={me?.currentWorkspace?.accessToken?.token}
						>
							{me?.currentWorkspace?.accessToken?.redactedToken}
						</CodeBlock>
					</div>
				</div>
			</div>
		</>
	);
}
