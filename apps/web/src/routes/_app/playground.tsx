import DocumentCode01Icon from "virtual:icons/hugeicons/document-code";
import Image01Icon from "virtual:icons/hugeicons/image-01";
import Link01Icon from "virtual:icons/hugeicons/link-01";

import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";

import { useAppForm } from "#/components/forms/form";
import { PageHeader } from "#/components/page-header.tsx";
import { PlaygroundFormSchema } from "#/schemas/playground.ts";

export const Route = createFileRoute("/_app/playground")({
	component: RouteComponent,
});

function RouteComponent() {
	const form = useAppForm({
		validators: { onSubmit: PlaygroundFormSchema },
		defaultValues: {
			url: "",
		},
		onSubmit: ({ value }) => console.log(value),
	});

	const handleSubmit = React.useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			e.stopPropagation();
			form.handleSubmit();
		},
		[form],
	);

	return (
		<>
			<PageHeader
				icon={
					<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--bg-white-0) shadow-xs ring-(--stroke-soft-200) ring-1 ring-inset">
						<DocumentCode01Icon className="size-6 text-(--text-sub-600)" />
					</div>
				}
				title="Playground"
				description="Customize configuration to generate the URL of your screenshot"
			/>

			<div className="px-4 pb-6 lg:px-8">
				<form.AppForm>
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-3 py-6 md:flex-row"
					>
						<form.AppField
							name="url"
							children={(field) => (
								<field.TextField
									wrapperClassName="flex-1"
									label="URL"
									leadingIcon={Link01Icon}
									type="url"
									inputMode="url"
									name="url"
									placeholder="https://polar.sh"
									labelClassName="sr-only"
								/>
							)}
						/>

						<div className="flex flex-wrap gap-3 sm:flex-nowrap">
							<form.SubmitButton
								trailingIcon={Image01Icon}
								$type="primary"
								className="rounded-10"
							>
								Generate image
							</form.SubmitButton>
						</div>
					</form>
				</form.AppForm>
			</div>
		</>
	);
}
