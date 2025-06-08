
import AddCircleIcon from "virtual:icons/hugeicons/add-circle";
import Key01Icon from "virtual:icons/hugeicons/key-01";

import { ApiKeysFilterSchema } from "@screenshothis/schemas/api-keys";
import { useQuery } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-adapter";

import { DashedDivider } from "#/components/dashed-divider.tsx";
import { ApiKeysFilter } from "#/components/filters/api-keys-filter.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { KeysTable } from "#/components/tables/keys-table.tsx";
import { Button } from "#/components/ui/button.tsx";
import { useActionsParams } from "#/hooks/use-actions-params.ts";
import { authClient } from "#/lib/auth.ts";

export const Route = createFileRoute({
	validateSearch: zodValidator(ApiKeysFilterSchema),
	component: RouteComponent,
});

function RouteComponent() {
	const { data: apiKeys } = useQuery({
		queryKey: ["api-keys"],
		queryFn: () => authClient.apiKey.list().then((res) => res.data),
	});
	const { setParams } = useActionsParams();

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
			>
				<Button
					$type="neutral"
					onClick={() => setParams({ action: "create", resource: "api-key" })}
					trailingIcon={AddCircleIcon}
				>
					Create API Key
				</Button>
			</PageHeader>

			<div className="grid gap-4 px-4 pb-6 lg:px-8">
				<DashedDivider />

				<ApiKeysFilter />

				<KeysTable data={apiKeys ?? []} total={apiKeys?.length ?? 0} />
			</div>
		</>
	);
}
