import Album02Icon from "virtual:icons/hugeicons/album-02";

import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";

import { DashedDivider } from "#/components/dashed-divider.tsx";
import { ScreenshotsFilter } from "#/components/filters/screenshots-filter.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { ScreenshotsTable } from "#/components/tables/screenshots-table";
import { ScreenshotsFilterSchema } from "#/schemas/screenshots.ts";

export const Route = createFileRoute("/_app/screenshots")({
	component: RouteComponent,
	validateSearch: zodValidator(ScreenshotsFilterSchema),
	loaderDeps: ({ search: { q } }) => ({ q }),
	async loader({ context: { queryClient, orpc }, deps }) {
		const screenshots = await queryClient.fetchQuery(
			orpc.screenshots.list.queryOptions({
				input: {
					q: deps.q,
				},
			}),
		);

		return {
			screenshots,
		};
	},
});

function RouteComponent() {
	const { screenshots } = Route.useLoaderData();

	return (
		<>
			<PageHeader
				icon={
					<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--bg-white-0) shadow-xs ring-(--stroke-soft-200) ring-1 ring-inset">
						<Album02Icon className="size-6 text-(--text-sub-600)" />
					</div>
				}
				title="Screenshots"
				description="See all the screenshots you've taken"
			/>

			<div className="grid gap-4 px-4 pb-6 lg:px-8">
				<DashedDivider />

				<ScreenshotsFilter />
				<ScreenshotsTable
					data={screenshots ?? []}
					total={screenshots?.length ?? 0}
				/>
			</div>
		</>
	);
}
