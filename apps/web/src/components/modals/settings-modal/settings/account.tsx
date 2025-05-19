"use client";

import { UpdateUserSchema } from "@screenshothis/schemas/users";
import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { Dialog as DialogPrimitives } from "radix-ui";
import * as React from "react";
import type { z } from "zod";

import { DashedDivider } from "#/components/dashed-divider.tsx";
import { useAppForm } from "#/components/forms/form.tsx";
import * as Avatar from "#/components/ui/avatar.tsx";
import { Button } from "#/components/ui/button.tsx";
import * as Divider from "#/components/ui/divider.tsx";
import * as ToastAlert from "#/components/ui/toast-alert.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { useMe } from "#/hooks/use-me.ts";
import { useORPC } from "#/hooks/use-orpc.ts";
import { useSettingsStore } from "#/store/settings.ts";

export function AccountSettings() {
	const { queryClient } = useRouteContext({
		from: "__root__",
	});
	const me = useMe();
	const { setOpen } = useSettingsStore();
	const orpc = useORPC();
	const { mutateAsync } = useMutation(orpc.users.update.mutationOptions());
	const form = useAppForm({
		defaultValues: {
			name: me?.fullName ?? "",
			email: me?.email ?? "",
			image: me?.imageUrl ?? "",
		} as z.input<typeof UpdateUserSchema>,
		validators: {
			onSubmit: UpdateUserSchema,
		},
		async onSubmit({ value }) {
			await mutateAsync(value, {
				onSuccess() {
					toast.custom((t) => (
						<ToastAlert.Root
							t={t}
							$status="success"
							$variant="filled"
							message="Account updated successfully"
						/>
					));

					queryClient.invalidateQueries({
						queryKey: orpc.users.me.queryOptions().queryKey,
					});
				},
			});
		},
	});
	const [imagePreview, setImagePreview] = React.useState<string | null>(null);

	return (
		<form.AppForm>
			<div>
				<div className="flex w-full flex-col gap-3.5 px-5 py-4 sm:flex-row sm:items-center">
					<div className="flex-1">
						<DialogPrimitives.Title className="text-(--text-strong-950) text-label-md">
							Account Settings
						</DialogPrimitives.Title>
						<DialogPrimitives.Description className="mt-1 text-(--text-sub-600) text-paragraph-sm">
							Manage and collaborate on your account settings
						</DialogPrimitives.Description>
					</div>
					<div className="grid grid-cols-2 items-center gap-3 sm:flex">
						<Button
							$type="neutral"
							$style="stroke"
							$size="sm"
							className="rounded-10"
							onClick={setOpen}
						>
							Discard
						</Button>
						<form.SubmitButton
							$size="sm"
							className="rounded-10"
							form="account-settings-form"
						>
							Save Changes
						</form.SubmitButton>
					</div>
				</div>

				<Divider.Root />

				<form
					id="account-settings-form"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
					encType="multipart/form-data"
					className="flex flex-col gap-5 p-6"
				>
					{/* Profile Photo */}
					<div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_312px] sm:gap-6">
						<div>
							<div className="text-(--text-strong-950) text-label-sm">
								Profile Photo
							</div>
							<div className="mt-1 text-(--text-sub-600) text-paragraph-xs">
								Min 400x400px, PNG or JPEG formats.
							</div>
						</div>
						<div className="flex items-center gap-5">
							<Avatar.Root $size="80">
								{(imagePreview || me?.imageUrl) && (
									<Avatar.Image src={imagePreview || me?.imageUrl || ""} />
								)}
							</Avatar.Root>

							<label htmlFor="image">
								<Button asChild $type="neutral" $style="stroke" $size="xs">
									<div>Change</div>
								</Button>

								<form.AppField
									name="image"
									children={(field) => (
										<input
											type="file"
											multiple={false}
											tabIndex={-1}
											accept="image/*"
											name="image"
											id="image"
											className="sr-only"
											onBlur={field.handleBlur}
											onChange={(e) => {
												const file = e.target.files?.[0] || null;
												field.handleChange(file);
												setImagePreview(
													file ? URL.createObjectURL(file) : null,
												);
											}}
										/>
									)}
								/>
							</label>
						</div>
					</div>

					<DashedDivider />

					{/* Name */}
					<div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_312px] sm:gap-6">
						<div>
							<div className="text-(--text-strong-950) text-label-sm">
								Full Name
							</div>
							<div className="mt-1 text-(--text-sub-600) text-paragraph-xs">
								Your name will be visible to your workspace members and for you.
							</div>
						</div>

						<form.AppField
							name="name"
							children={(field) => (
								<field.TextField
									label="Full Name"
									labelClassName="sr-only"
									name="name"
									id="name"
								/>
							)}
						/>
					</div>

					<DashedDivider />

					{/* Email */}
					<div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_312px] sm:gap-6">
						<div>
							<div className="text-(--text-strong-950) text-label-sm">
								Email Address
							</div>
							<div className="mt-1 text-(--text-sub-600) text-paragraph-xs">
								If you change your email address, you will need to verify it
								again.
							</div>
						</div>
						<form.AppField
							name="email"
							children={(field) => (
								<field.TextField
									label="Email Address"
									labelClassName="sr-only"
									name="email"
									id="email"
									type="email"
									inputMode="email"
									autoComplete="off"
								/>
							)}
						/>
					</div>
				</form>
			</div>
		</form.AppForm>
	);
}
