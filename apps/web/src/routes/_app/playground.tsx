import CropIcon from "virtual:icons/hugeicons/crop";
import DocumentCode01Icon from "virtual:icons/hugeicons/document-code";
import Image01Icon from "virtual:icons/hugeicons/image-01";
import Link01Icon from "virtual:icons/hugeicons/link-01";

import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import type { z } from "zod";

import { CodeBlock } from "#/components/code-block.tsx";
import { useAppForm } from "#/components/forms/form.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import * as Accordion from "#/components/ui/accordion.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { PlaygroundFormSchema } from "#/schemas/playground.ts";
import { useORPC } from "#/utils/orpc.ts";

export const Route = createFileRoute("/_app/playground")({
	component: RouteComponent,
});

function RouteComponent() {
	const { queryClient } = Route.useRouteContext();
	const orpc = useORPC();
	const { mutateAsync, data } = useMutation(orpc.playground.mutationOptions());
	const form = useAppForm({
		validators: { onSubmit: PlaygroundFormSchema },
		defaultValues: {
			url: "",
		} as z.input<typeof PlaygroundFormSchema>,
		onSubmit: async ({ value }) => {
			await mutateAsync(value, {
				async onSuccess() {
					await queryClient.invalidateQueries({
						queryKey: orpc.me.queryOptions().queryKey,
					});
				},
			});
		},
	});
	const values = useStore(form.store, (state) => state.values);

	const handleSubmit = React.useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			e.stopPropagation();
			form.handleSubmit();
		},
		[form],
	);

	console.info(form.state.errors);

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
					<form onSubmit={handleSubmit} className="grid gap-8 py-6 md:flex-row">
						<div className="flex gap-3">
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
									isSubmitting={form.state.isSubmitting}
								>
									{form.state.isSubmitting ? "Generating..." : "Generate image"}
								</form.SubmitButton>
							</div>
						</div>

						<div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
							<Accordion.Root
								defaultValue={["viewport", "ads"]}
								type="multiple"
								className="grid gap-3"
							>
								<Accordion.Item value="viewport">
									<Accordion.Trigger>
										<Accordion.Icon as={CropIcon} />
										Viewport
										<Accordion.Arrow />
									</Accordion.Trigger>
									<Accordion.Content className="mt-2 px-7.5">
										<div className="grid grid-cols-2 gap-3">
											<form.AppField
												name="width"
												children={(field) => (
													<field.TextField
														label="Width"
														type="number"
														inputMode="numeric"
														name="width"
														placeholder="1920"
													/>
												)}
											/>
											<form.AppField
												name="height"
												children={(field) => (
													<field.TextField
														label="Height"
														type="number"
														inputMode="numeric"
														name="height"
														placeholder="1080"
													/>
												)}
											/>
										</div>
									</Accordion.Content>
								</Accordion.Item>

								<Accordion.Item value="ads">
									<Accordion.Trigger>
										<Accordion.Icon as={CropIcon} />
										Ads, tracking and more
										<Accordion.Arrow />
									</Accordion.Trigger>
									<Accordion.Content className="mt-2 px-7.5">
										<div className="grid gap-3 lg:grid-cols-3">
											<form.AppField
												name="block_ads"
												children={(field) => (
													<field.SwitchField
														label="Block ads"
														name="block_ads"
													/>
												)}
											/>
											<form.AppField
												name="block_cookie_banners"
												children={(field) => (
													<field.SwitchField
														label="Block cookie banners"
														name="block_cookie_banners"
													/>
												)}
											/>
											<form.AppField
												name="block_trackers"
												children={(field) => (
													<field.SwitchField
														label="Block trackers"
														name="block_trackers"
													/>
												)}
											/>
										</div>
									</Accordion.Content>
								</Accordion.Item>
							</Accordion.Root>

							{/* Preview */}
							<div>
								<div className="flex flex-col gap-2 rounded-16 bg-(--bg-weak-50) p-2 lg:gap-3 lg:p-3">
									<div className="flex w-full items-center justify-between px-2">
										<div className="font-medium font-mono text-(--text-sub-600) text-paragraph-xs tracking-normal md:text-paragraph-sm">
											Preview your screenshot 👇
										</div>
									</div>

									<div className="aspect-video w-full rounded-10 bg-(--bg-white-0)">
										{form.state.isSubmitting ? (
											<Skeleton className="h-full w-full rounded-10" />
										) : data?.image ? (
											<img
												src={data.image}
												alt="Screenshot"
												className="w-full rounded-10"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center rounded-10 bg-(--bg-white-0) text-(--text-sub-600) text-paragraph-sm">
												No screenshot generated yet
											</div>
										)}
									</div>
								</div>

								<CodeBlock
									title="Generated URL"
									wrapperClassName="mt-8"
									lang="bash"
									children={[
										`https://api.screenshothis.com/v1/screenshots/take?url=${values.url || "https://polar.sh"}`,
										values.width && `   &width=${values.width}`,
										values.height && `   &height=${values.height}`,
										values.format && `   &format=${values.format}`,
										values.block_ads && `   &block_ads=${values.block_ads}`,
										values.block_cookie_banners &&
											`   &block_cookie_banners=${values.block_cookie_banners}`,
										values.block_trackers &&
											`   &block_trackers=${values.block_trackers}`,
									]
										.filter(Boolean)
										.join("\n")}
								/>
							</div>
						</div>
					</form>
				</form.AppForm>
			</div>
		</>
	);
}
