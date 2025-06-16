import AdvertisimentIcon from "virtual:icons/hugeicons/advertisiment";
import Alert01SolidIcon from "virtual:icons/hugeicons/alert-01-solid";
import CropIcon from "virtual:icons/hugeicons/crop";
import Database02Icon from "virtual:icons/hugeicons/database-02";
import DocumentCode01Icon from "virtual:icons/hugeicons/document-code";
import EaseInOutIcon from "virtual:icons/hugeicons/ease-in-out";
import FullScreenIcon from "virtual:icons/hugeicons/full-screen";
import Image01Icon from "virtual:icons/hugeicons/image-01";
import Link01Icon from "virtual:icons/hugeicons/link-01";
import PaintBrush02Icon from "virtual:icons/hugeicons/paint-brush-02";
import SecurityLockIcon from "virtual:icons/hugeicons/security-lock";
import SquareArrowHorizontalIcon from "virtual:icons/hugeicons/square-arrow-horizontal";
import SquareArrowVerticalIcon from "virtual:icons/hugeicons/square-arrow-vertical";
import Timer01Icon from "virtual:icons/hugeicons/timer-01";
import ToggleOnIcon from "virtual:icons/hugeicons/toggle-on";
import ZoomOutAreaIcon from "virtual:icons/hugeicons/zoom-out-area";

import { betterFetch } from "@better-fetch/fetch";
import {
	CreateScreenshotSchema,
	FormatSchema,
	PrefersColorSchemeSchema,
	PrefersReducedMotionSchema,
	ResourceTypeSchema,
} from "@screenshothis/schemas/screenshots";
import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { z } from "zod";

import { useAppForm } from "#/components/forms/form.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { ScreenshotPreview } from "#/components/playground/screenshot-preview.tsx";
import { UrlGenerator } from "#/components/playground/url-generator.tsx";
import * as Accordion from "#/components/ui/accordion.tsx";
import * as Alert from "#/components/ui/alert.tsx";
import * as Kbd from "#/components/ui/kbd.tsx";
import * as AlertToast from "#/components/ui/toast-alert.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { useMe } from "#/hooks/use-me.ts";
import { useORPC } from "#/hooks/use-orpc.ts";
import { env } from "#/utils/env.ts";
import type { PlaygroundFormValues } from "#/utils/playground-utils.ts";
import { isScreenshotAllowed } from "#/utils/screenshots.ts";

export const Route = createFileRoute({
	component: RouteComponent,
});

/**
 * Renders the main playground UI for configuring and generating website screenshots.
 *
 * Provides a form with advanced options for customizing screenshot parameters, including viewport, image output, resource blocking, emulation, caching, and authorization. Handles user authentication and URL permission checks before generating screenshots. Displays a live preview of the generated image and a URL generator reflecting current form values.
 *
 * @returns The React component for the screenshot playground route.
 *
 * @remark Users must be logged in and the target URL must be allowed by the current workspace's origin restrictions to generate screenshots.
 */
function RouteComponent() {
	const { queryClient } = Route.useRouteContext();
	const orpc = useORPC();
	const me = useMe();
	const { mutateAsync, error, isError, data } = useMutation({
		async mutationFn(input: PlaygroundFormValues) {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(input)) {
				if (value !== null && value !== undefined) {
					params.set(key, String(value));
				}
			}

			if (!me) {
				toast.custom((t) => (
					<AlertToast.Root
						t={t}
						$status="error"
						$variant="lighter"
						message="You need to be logged in to generate screenshots"
					/>
				));
				return;
			}

			if (me.currentWorkspace?.metadata?.allowedOrigins.length > 0) {
				const isAllowed = isScreenshotAllowed(
					me.currentWorkspace.metadata.allowedOrigins.split("\n"),
					input.url,
				);
				if (!isAllowed) {
					toast.custom((t) => (
						<AlertToast.Root
							t={t}
							$status="error"
							$variant="lighter"
							message="The URL is not allowed to be screenshot"
						/>
					));
					return;
				}
			}

			try {
				const blob = await betterFetch(
					`${env.VITE_SERVER_URL}/v1/screenshots/take?${params.toString()}`,
					{
						output: z.instanceof(Blob),
						throw: true,
					},
				);

				const url = URL.createObjectURL(blob);

				return { image: url };
			} catch (err) {
				let message =
					err instanceof Error && err.message
						? err.message
						: "An unexpected error occurred";

				// Attempt to extract error message from JSON response if available
				const errWithResponse = err as { response?: unknown };
				if (
					errWithResponse &&
					typeof errWithResponse === "object" &&
					"response" in errWithResponse &&
					errWithResponse.response instanceof Response
				) {
					try {
						const jsonBody = await errWithResponse.response.clone().json();
						if (jsonBody && typeof jsonBody === "object") {
							message =
								"message" in jsonBody
									? String(jsonBody.message)
									: "error" in jsonBody
										? String(jsonBody.error)
										: message;
						}
					} catch {
						// Ignore JSON parse errors
					}
				}

				toast.custom((t) => (
					<AlertToast.Root
						t={t}
						$status="error"
						$variant="lighter"
						message={message}
					/>
				));

				return;
			}
		},
	});

	const form = useAppForm({
		validators: { onSubmit: CreateScreenshotSchema },
		defaultValues: {
			url: "",
			api_key: "",
			block_ads: true,
			block_cookie_banners: true,
			block_trackers: true,
			prefers_color_scheme: "light",
			user_agent: "",
			headers: "",
			cookies: "",
			bypass_csp: false,
		} as PlaygroundFormValues,
		onSubmit: async ({ value }) => {
			await mutateAsync(value, {
				async onSuccess() {
					await queryClient.invalidateQueries({
						queryKey: orpc.users.me.queryKey(),
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
			void form.handleSubmit();
		},
		[form],
	);

	useHotkeys(["ctrl+enter", "meta+enter"], () => {
		void form.handleSubmit();
	});

	const errorMessage = React.useMemo(() => {
		if (!isError || !error) return undefined;
		return error.message || "An unexpected error occurred";
	}, [error, isError]);

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

						<Alert.Root $variant="lighter" $status="feature">
							<span className="inline-flex items-center gap-1">
								<strong>💡 Pro tip:</strong> Use{" "}
								<Kbd.Root>Cmd/Ctrl + Enter</Kbd.Root> to quickly generate
								screenshots.
							</span>
						</Alert.Root>

						<div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2 lg:gap-5">
							<div className="grid gap-5">
								<form.AppField
									name="api_key"
									children={(field) => (
										<field.TextField
											label="API key"
											name="api_key"
											id="api_key"
											placeholder="your-api-key"
											hint="The API key to use for the screenshot. We don't save it."
										/>
									)}
								/>

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
															leadingIcon={SquareArrowHorizontalIcon}
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
															leadingIcon={SquareArrowVerticalIcon}
														/>
													)}
												/>
											</div>

											<div className="grid grid-cols-3 gap-3">
												<form.AppField
													name="is_mobile"
													children={(field) => (
														<field.SwitchField
															labelClassName="order-last"
															childrenWrapperClassName="flex"
															className="p-0"
															label="Is mobile?"
															name="is_mobile"
														/>
													)}
												/>

												<form.AppField
													name="is_landscape"
													children={(field) => (
														<field.SwitchField
															labelClassName="order-last"
															childrenWrapperClassName="flex"
															className="p-0"
															label="Is landscape?"
															name="is_landscape"
														/>
													)}
												/>

												<form.AppField
													name="has_touch"
													children={(field) => (
														<field.SwitchField
															labelClassName="order-last"
															childrenWrapperClassName="flex"
															className="p-0"
															label="Has touch?"
															name="has_touch"
														/>
													)}
												/>
											</div>

											<form.AppField
												name="device_scale_factor"
												children={(field) => (
													<field.TextField
														label="Device scale factor"
														type="number"
														inputMode="numeric"
														name="device_scale_factor"
														placeholder="1"
														leadingIcon={ZoomOutAreaIcon}
														hint="In most cases, you can leave this at 1, otherwise we recommend 0.75."
													/>
												)}
											/>
										</Accordion.Content>
									</Accordion.Item>

									<Accordion.Item value="full-page">
										<Accordion.Trigger>
											<Accordion.Icon as={FullScreenIcon} />
											Full page
											<Accordion.Arrow />
										</Accordion.Trigger>
										<Accordion.Content className="mt-2 grid gap-3 px-7.5">
											<div className="grid grid-cols-2 items-start gap-6">
												<form.AppField
													name="full_page"
													children={(field) => (
														<field.SwitchField
															childrenWrapperClassName="flex items-center"
															className="order-first p-0"
															label="Capture the full page"
															name="full_page"
															id="full_page"
														/>
													)}
												/>

												<form.AppField
													name="full_page_scroll"
													children={(field) => (
														<field.SwitchField
															childrenWrapperClassName="flex items-center"
															className="order-first p-0"
															label="Scroll the full page"
															name="full_page_scroll"
															id="full_page_scroll"
															hint="Scroll the full page to trigger lazy loading"
														/>
													)}
												/>
											</div>

											<form.AppField
												name="full_page_scroll_duration"
												children={(field) => (
													<field.TextField
														leadingIcon={Timer01Icon}
														label="Scroll duration"
														type="number"
														inputMode="numeric"
														name="full_page_scroll_duration"
														id="full_page_scroll_duration"
														placeholder="i.e. 400"
														hint="The duration of the scroll in milliseconds"
													/>
												)}
											/>
										</Accordion.Content>
									</Accordion.Item>

									<Accordion.Item value="image-output">
										<Accordion.Trigger>
											<Accordion.Icon as={Image01Icon} />
											Image Output
											<Accordion.Arrow />
										</Accordion.Trigger>
										<Accordion.Content className="mt-2 grid gap-3 px-7.5">
											<div className="grid grid-cols-2 gap-3">
												<form.AppField
													name="format"
													children={(field) => (
														<field.SelectField
															label="Format"
															name="format"
															id="format"
															placeholder="Select format"
															defaultValue="jpeg"
															options={FormatSchema.options.map((option) => ({
																value: option,
																label: option.toUpperCase(),
															}))}
														/>
													)}
												/>

												<form.AppField
													name="quality"
													children={(field) => (
														<field.TextField
															label="Quality"
															type="number"
															min="20"
															max="100"
															inputMode="numeric"
															name="quality"
															placeholder="80"
															hint="20-100 (default: 80)"
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
														name="prefers_color_scheme"
														id="prefers_color_scheme"
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
														name="prefers_reduced_motion"
														id="prefers_reduced_motion"
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

									<Accordion.Item value="caching">
										<Accordion.Trigger>
											<Accordion.Icon as={Database02Icon} />
											Caching
											<Accordion.Arrow />
										</Accordion.Trigger>

										<Accordion.Content className="mt-2 grid gap-3 px-7.5">
											<form.AppField
												name="is_cached"
												children={(field) => (
													<field.SwitchField
														childrenWrapperClassName="flex items-center"
														className="order-first p-0"
														label="Cache the image"
														name="is_cached"
														id="is_cached"
													/>
												)}
											/>

											<div className="grid grid-cols-2 gap-3">
												<form.AppField
													name="cache_ttl"
													children={(field) => (
														<field.TextField
															label="Cache TTL"
															type="number"
															id="cache_ttl"
															inputMode="numeric"
															name="cache_ttl"
															placeholder="3600"
															hint="The time to live of the cache in seconds (min: 3600, max: 31622400)."
														/>
													)}
												/>

												<form.AppField
													name="cache_key"
													children={(field) => (
														<field.TextField
															label="Cache key"
															name="cache_key"
															placeholder="my-custom-key"
															id="cache_key"
														/>
													)}
												/>
											</div>
										</Accordion.Content>
									</Accordion.Item>

									{/* Authorization */}
									<Accordion.Item value="authorization">
										<Accordion.Trigger>
											<Accordion.Icon as={SecurityLockIcon} />
											Authorization
											<Accordion.Arrow />
										</Accordion.Trigger>
										<Accordion.Content className="mt-2 grid gap-3 px-7.5">
											<form.AppField
												name="user_agent"
												children={(field) => (
													<field.TextField
														label="User Agent"
														name="user_agent"
														id="user_agent"
														placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
														hint="Custom user agent strings can be used for fingerprinting; use responsibly."
														hintIcon={Alert01SolidIcon}
														hintIconClassName="text-state-warning-base"
													/>
												)}
											/>

											<form.AppField
												name="headers"
												children={(field) => (
													<field.Textarea
														label="Headers"
														name="headers"
														id="headers"
														rows={5}
														placeholder={[
															"Authorization: Bearer <token>",
															"X-Custom-Header: custom-value",
														].join("\n")}
														hint="One header per line (Name: Value). Avoid adding security-sensitive headers."
														hintIcon={Alert01SolidIcon}
														hintIconClassName="text-state-warning-base"
													/>
												)}
											/>

											<form.AppField
												name="cookies"
												children={(field) => (
													<field.Textarea
														label="Cookies"
														name="cookies"
														id="cookies"
														rows={5}
														placeholder={[
															"sessionid=abc123; Domain=example.com; Path=/; HttpOnly",
															"theme=dark; Path=/; SameSite=Lax",
														].join("\n")}
														hint="One cookie per line. Only valid cookies; misuse may bypass security controls."
														hintIcon={Alert01SolidIcon}
														hintIconClassName="text-state-warning-base"
													/>
												)}
											/>

											<form.AppField
												name="bypass_csp"
												children={(field) => (
													<field.SwitchField
														label="Bypass CSP"
														name="bypass_csp"
														id="bypass_csp"
														hint="Bypasses Content Security Policy protections; use with extreme caution."
														hintIcon={Alert01SolidIcon}
														hintIconClassName="text-state-warning-base"
													/>
												)}
											/>
										</Accordion.Content>
									</Accordion.Item>
								</Accordion.Root>
							</div>

							{/* Preview */}
							<div className="sticky top-5 space-y-6">
								<ScreenshotPreview
									imageUrl={data?.image}
									isLoading={form.state.isSubmitting}
									error={errorMessage}
								/>

								<UrlGenerator values={values} />
							</div>
						</div>
					</form>
				</form.AppForm>
			</div>
		</>
	);
}
