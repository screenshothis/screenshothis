import AdvertisimentIcon from "virtual:icons/hugeicons/advertisiment";
import CropIcon from "virtual:icons/hugeicons/crop";
import DocumentCode01Icon from "virtual:icons/hugeicons/document-code";
import EaseInOutIcon from "virtual:icons/hugeicons/ease-in-out";
import Image01Icon from "virtual:icons/hugeicons/image-01";
import Link01Icon from "virtual:icons/hugeicons/link-01";
import PaintBrush02Icon from "virtual:icons/hugeicons/paint-brush-02";
import ToggleOnIcon from "virtual:icons/hugeicons/toggle-on";

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
import {
	PlaygroundFormSchema,
	PrefersColorSchemeSchema,
	PrefersReducedMotionSchema,
	ResourceTypeSchema,
} from "#/schemas/playground.ts";
import { cn } from "#/utils/cn.ts";
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
			block_ads: true,
			block_cookie_banners: true,
			block_trackers: true,
			prefers_color_scheme: "light",
		} as z.input<typeof PlaygroundFormSchema>,
		onSubmit: async ({ value }) => {
			await mutateAsync(
				{
					...value,
					block_requests: Array.isArray(value.block_requests)
						? value.block_requests
						: value.block_requests?.split("\n").map((s) => s.trim()),
					block_resources: value.block_resources,
				},
				{
					async onSuccess() {
						await queryClient.invalidateQueries({
							queryKey: orpc.me.queryOptions().queryKey,
						});
					},
				},
			);
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

	const code = React.useMemo(() => {
		return [
			"https://api.screenshothis.com/v1/screenshots/take",
			`   ?url=${values.url || "https://polar.sh"}`,
			values.selector && `   &selector=${values.selector}`,
			values.width && `   &width=${values.width}`,
			values.height && `   &height=${values.height}`,
			values.is_mobile && `   &is_mobile=${values.is_mobile}`,
			values.is_landscape && `   &is_landscape=${values.is_landscape}`,
			values.has_touch && `   &has_touch=${values.has_touch}`,
			values.format && `   &format=${values.format}`,
			values.block_ads && `   &block_ads=${values.block_ads}`,
			values.block_cookie_banners &&
				`   &block_cookie_banners=${values.block_cookie_banners}`,
			values.block_trackers && `   &block_trackers=${values.block_trackers}`,
			values.block_requests &&
				typeof values.block_requests === "string" &&
				values.block_requests
					.split("\n")
					.map((request) => `   &block_requests=${request}`)
					.join("\n"),
			values.block_resources
				?.map((resource) => `   &block_resources=${resource}`)
				.join("\n"),
			values.prefers_color_scheme &&
				`   &prefers_color_scheme=${values.prefers_color_scheme}`,
			values.prefers_reduced_motion &&
				`   &prefers_reduced_motion=${values.prefers_reduced_motion}`,
		]
			.filter(Boolean)
			.join("\n");
	}, [values]);

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
							<div className="grid gap-5">
								<form.AppField
									name="selector"
									children={(field) => (
										<field.TextField
											label="Selector"
											name="selector"
											id="selector"
											placeholder="body > div.container"
											hint="The element to screenshot. Defaults to the entire page."
										/>
									)}
								/>

								<Accordion.Root
									defaultValue={["viewport"]}
									type="multiple"
									className="grid gap-5"
								>
									<Accordion.Item value="viewport">
										<Accordion.Trigger>
											<Accordion.Icon as={CropIcon} />
											Viewport
											<Accordion.Arrow />
										</Accordion.Trigger>
										<Accordion.Content className="mt-2 grid gap-3 px-7.5">
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

											<div className="grid grid-cols-3 gap-3">
												<form.AppField
													name="is_mobile"
													children={(field) => (
														<field.SwitchField
															wrapperClassName="flex"
															label="Is mobile?"
															name="is_mobile"
															labelClassName="order-last"
														/>
													)}
												/>

												<form.AppField
													name="is_landscape"
													children={(field) => (
														<field.SwitchField
															wrapperClassName="flex"
															label="Is landscape?"
															name="is_landscape"
															labelClassName="order-last"
														/>
													)}
												/>

												<form.AppField
													name="has_touch"
													children={(field) => (
														<field.SwitchField
															wrapperClassName="flex"
															label="Has touch?"
															name="has_touch"
															labelClassName="order-last"
														/>
													)}
												/>
											</div>
										</Accordion.Content>
									</Accordion.Item>

									<Accordion.Item value="ads">
										<Accordion.Trigger>
											<Accordion.Icon as={AdvertisimentIcon} />
											Ads, tracking and more
											<Accordion.Arrow />
										</Accordion.Trigger>
										<Accordion.Content className="mt-2 px-7.5">
											<div className="grid gap-6 lg:grid-cols-3">
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

												<form.AppField
													name="block_requests"
													children={(field) => (
														<field.Textarea
															wrapperClassName="lg:col-span-3"
															label="Block requests"
															name="block_requests"
															rows={5}
															placeholder={[
																"*.js",
																"*.css",
																"https://ads.example.com/*",
																"https://tracker.example.com/script.js",
																"example.com/annoying-banner.png",
																"facebook.com",
															].join("\n")}
															hint="One pattern per line. Supports wildcards."
														/>
													)}
												/>

												<fieldset className="grid gap-3 lg:col-span-3">
													<div className="grid">
														<legend className="font-medium text-(--text-sub-600)">
															Block resources
														</legend>
														<p className="text-(--text-sub-600) text-paragraph-xs">
															Select the resources you want to block.
														</p>
													</div>

													<div className="grid gap-1.5">
														<form.AppField
															name="block_resources"
															children={(field) =>
																ResourceTypeSchema.options.map((option) => (
																	<field.CheckboxField
																		wrapperClassName="flex lg:col-span-3"
																		labelClassName="order-last"
																		key={option}
																		label={option}
																		name="block_resources"
																		value={option}
																		checked={values.block_resources?.includes(
																			option,
																		)}
																		onCheckedChange={(checked) => {
																			if (checked) {
																				field.handleChange([
																					...(values.block_resources ?? []),
																					option,
																				]);
																			} else {
																				field.handleChange(
																					values.block_resources?.filter(
																						(r) => r !== option,
																					) ?? [],
																				);
																			}
																		}}
																	/>
																))
															}
														/>
													</div>
												</fieldset>
											</div>
										</Accordion.Content>
									</Accordion.Item>

									<Accordion.Item value="emulations">
										<Accordion.Trigger>
											<Accordion.Icon as={ToggleOnIcon} />
											Emulations
											<Accordion.Arrow />
										</Accordion.Trigger>

										<Accordion.Content className="mt-2 grid gap-3 px-7.5">
											<form.AppField
												name="prefers_color_scheme"
												children={(field) => (
													<field.SelectField
														label="Prefers color scheme"
														triggerIcon={PaintBrush02Icon}
														options={PrefersColorSchemeSchema.options.map(
															(option) => ({
																value: option,
																label: option,
															}),
														)}
													/>
												)}
											/>

											<form.AppField
												name="prefers_reduced_motion"
												children={(field) => (
													<field.SelectField
														label="Prefers reduced motion"
														triggerIcon={EaseInOutIcon}
														placeholder="No preference (default)"
														options={PrefersReducedMotionSchema.options.map(
															(option) => ({
																value: option,
																label: option,
															}),
														)}
														hint="If you have animations, you can reduce them to avoid motion sickness."
													/>
												)}
											/>
										</Accordion.Content>
									</Accordion.Item>
								</Accordion.Root>
							</div>

							{/* Preview */}
							<div>
								<div className="flex flex-col gap-2 rounded-16 bg-(--bg-weak-50) p-2 lg:gap-3 lg:p-3">
									<div className="flex w-full items-center justify-between px-2">
										<div className="font-medium font-mono text-(--text-sub-600) text-paragraph-xs tracking-normal md:text-paragraph-sm">
											Preview your screenshot 👇
										</div>
									</div>

									<div
										className={cn(
											"w-full rounded-10 bg-(--bg-white-0) transition-[height] duration-300",
											!data?.image && "aspect-video",
										)}
									>
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
									isCopyable
									textToCopy={code.replaceAll("\n", "").replaceAll("   ", "")}
									children={code}
								/>
							</div>
						</div>
					</form>
				</form.AppForm>
			</div>
		</>
	);
}
