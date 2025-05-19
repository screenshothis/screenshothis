"use client";

import { UpdateWorkspaceSchema } from "@screenshothis/schemas/workspaces";
import { useRouteContext } from "@tanstack/react-router";
import { Dialog as DialogPrimitives } from "radix-ui";
import type { z } from "zod";

import { DashedDivider } from "#/components/dashed-divider.tsx";
import { useAppForm } from "#/components/forms/form.tsx";
import { Button } from "#/components/ui/button.tsx";
import * as Divider from "#/components/ui/divider.tsx";
import * as ToastAlert from "#/components/ui/toast-alert.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { useDelayedPending } from "#/hooks/use-delayed-pending.ts";
import { useMe } from "#/hooks/use-me.ts";
import { useORPC } from "#/hooks/use-orpc.ts";
import { authClient } from "#/lib/auth.ts";
import { useSettingsStore } from "#/store/settings.ts";

export function WorkspaceSettings() {
	const { queryClient } = useRouteContext({
		from: "__root__",
	});
	const me = useMe();
	const { setOpen } = useSettingsStore();
	const orpc = useORPC();
	const form = useAppForm({
		defaultValues: {
			id: me?.currentWorkspace?.id ?? "",
			name: me?.currentWorkspace?.name ?? "",
			metadata: {
				allowedOrigins: me?.currentWorkspace?.metadata?.allowedOrigins ?? [],
			},
		} as z.input<typeof UpdateWorkspaceSchema>,
		validators: {
			onSubmit: UpdateWorkspaceSchema,
		},
		async onSubmit({ value }) {
			try {
				await authClient.organization.update({
					data: {
						name: value.name,
						metadata: value.metadata,
					},
					organizationId: value.id,
				});

				toast.custom((t) => (
					<ToastAlert.Root
						t={t}
						$status="success"
						$variant="filled"
						message="Workspace updated successfully"
					/>
				));

				queryClient.invalidateQueries({
					queryKey: orpc.users.me.queryOptions().queryKey,
				});
			} catch (error) {
				toast.custom((t) => (
					<ToastAlert.Root
						t={t}
						$status="error"
						$variant="filled"
						message="Failed to update workspace"
					/>
				));
			}
		},
	});
	const delayedPending = useDelayedPending({
		isPending: form.state.isSubmitting,
	});

	return (
		<form.AppForm>
			<div>
				<div className="flex w-full flex-col gap-3.5 px-5 py-4 sm:flex-row sm:items-center">
					<div className="flex-1">
						<DialogPrimitives.Title className="text-(--text-strong-950) text-label-md">
							Workspace Settings
						</DialogPrimitives.Title>
						<DialogPrimitives.Description className="mt-1 text-(--text-sub-600) text-paragraph-sm">
							Manage and collaborate on your workspace settings
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
							form="workspace-settings-form"
						>
							{delayedPending ? "Saving..." : "Save Changes"}
						</form.SubmitButton>
					</div>
				</div>

				<Divider.Root />

				<form
					id="workspace-settings-form"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
					className="flex flex-col gap-5 p-6"
				>
					{/* Name */}
					<div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_312px] sm:gap-6">
						<div>
							<div className="text-(--text-strong-950) text-label-sm">
								Workspace Name
							</div>
							<div className="mt-1 text-(--text-sub-600) text-paragraph-xs">
								The name of your workspace will be visible to all workspace
								members in the dashboard, navigation, and collaborative
								features.
							</div>
						</div>

						<form.AppField
							name="name"
							children={(field) => (
								<field.TextField
									label="Name"
									labelClassName="sr-only"
									name="name"
									id="name"
								/>
							)}
						/>
					</div>

					<DashedDivider />

					{/* Allowed Origins */}
					<div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_312px] sm:gap-6">
						<div>
							<div className="text-(--text-strong-950) text-label-sm">
								Allowed Origins
							</div>
							<div className="mt-1 text-(--text-sub-600) text-paragraph-xs">
								Specify the origins that are allowed to generate screenshots.
								Only requests from these domains will be permitted, enhancing
								security by preventing unauthorized access.
							</div>
						</div>

						<form.AppField
							name="metadata.allowedOrigins"
							children={(field) => (
								<field.Textarea
									wrapperClassName="col-span-full"
									label="Allowed origins"
									labelClassName="sr-only"
									name="metadata.allowedOrigins"
									rows={5}
									placeholder={[
										"example.com",
										"*.example.com",
										"sub.example.com",
									].join("\n")}
									hint="One pattern per line. Use exact domains (example.com) or wildcards for subdomains (*.example.com)."
								/>
							)}
						/>
					</div>
				</form>
			</div>
		</form.AppForm>
	);
}
