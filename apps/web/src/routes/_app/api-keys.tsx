import Key01Icon from "virtual:icons/hugeicons/key-01";

import { ApiKeysFilterSchema } from "@screenshothis/schemas/api-keys";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { objectToCamel } from "ts-case-convert";

import { DashedDivider } from "#/components/dashed-divider.tsx";
import { ApiKeysFilter } from "#/components/filters/api-keys-filter.tsx";
import { PageHeader } from "#/components/page-header.tsx";

export const Route = createFileRoute("/_app/api-keys")({
	validateSearch: zodValidator(ApiKeysFilterSchema),
	loaderDeps: ({ search: { q } }) => ({ q }),
	async loader({ context: { queryClient, orpc }, deps }) {
		const apiKeys = await queryClient
			.fetchQuery(
				orpc.apiKeys.list.queryOptions({
					input: {
						q: deps.q,
					},
				}),
			)
			.catch((error) => {
				console.error(error);

				return [];
			});

		return {
			apiKeys: apiKeys.map(objectToCamel),
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<PageHeader
				icon={
					<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--bg-white-0) shadow-xs ring-(--stroke-soft-200) ring-1 ring-inset">
						<Key01Icon className="size-6 text-(--text-sub-600)" />
					</div>
				}
				title="API Keys"
				description="Manage your API keys"
			/>

			<div className="grid gap-4 px-4 pb-6 lg:px-8">
				<DashedDivider />

				<ApiKeysFilter />
			</div>
		</>
	);
}
