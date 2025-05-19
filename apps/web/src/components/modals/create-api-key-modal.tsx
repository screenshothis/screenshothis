"use client";

import Alert01SolidIcon from "virtual:icons/hugeicons/alert-01-solid";
import Key01Icon from "virtual:icons/hugeicons/key-01";

import { CreateApiKeySchema } from "@screenshothis/schemas/api-keys";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { createApiKeyAction } from "#/actions/create-api-key-action.ts";
import { useActionsParams } from "#/hooks/use-actions-params.ts";
import { useMe } from "#/hooks/use-me.ts";
import { CodeBlock } from "../code-block.tsx";
import { useAppForm } from "../forms/form.tsx";
import * as Alert from "../ui/alert.tsx";
import { Button } from "../ui/button.tsx";
import * as Modal from "../ui/modal.tsx";
import * as AlertToast from "../ui/toast-alert.tsx";
import { toast } from "../ui/toast.tsx";

export function CreateApiKeyModal() {
	const { setParams, ...params } = useActionsParams();
	const [key, setKey] = React.useState<string | null>(null);
	const queryClient = useQueryClient();
	const me = useMe();
	const userPlan = me?.requestLimits?.plan ?? "free";
	const form = useAppForm({
		defaultValues: {
			name: "",
			plan: userPlan,
		},
		async onSubmit({ value }) {
			if (!userPlan) {
				toast.custom((t) => (
					<AlertToast.Root
						t={t}
						$status="error"
						$variant="filled"
						message="You need to have a valid plan to create an API key"
					/>
				));
				return;
			}

			const { data, error } = await createApiKeyAction({
				data: {
					...value,
					plan: userPlan, // Ensure server-side value takes precedence
				},
			});

			if (error) {
				toast.custom((t) => (
					<AlertToast.Root
						t={t}
						$status="error"
						$variant="filled"
						message={error.message ?? ""}
					/>
				));
				return;
			}

			setKey(data.key);
			await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
		},
		validators: {
			onSubmit: CreateApiKeySchema,
		},
	});

	const handleClose = async () => {
		await setParams({ action: null, resource: null });

		setKey(null);
		form.reset();
	};

	return (
		<Modal.Root
			open={params.action === "create" && params.resource === "api-key"}
			onOpenChange={handleClose}
		>
			<form.AppForm>
				<Modal.Content>
					<Modal.Header
						title="Create API Key"
						description="Create a new API key to access the API"
						icon={Key01Icon}
					/>

					<Modal.Body>
						{key ? (
							<div className="grid gap-4">
								<CodeBlock
									lang="bash"
									isCopyable
									textToCopy={key}
									children={key}
									className="rounded-lg"
									title="API Key"
								/>

								<Alert.Root $variant="light" $status="information" $size="xs">
									<Alert.Icon as={Alert01SolidIcon} />
									<p>
										Your access token has been generated.{" "}
										<strong>
											Please copy it now and store it in a safe location
										</strong>
										. For security reasons, you will not be able to view this
										token again after leaving this page.
									</p>
								</Alert.Root>
							</div>
						) : (
							<form
								id="create-api-key-form"
								className="grid gap-6"
								onSubmit={(e) => {
									e.preventDefault();
									e.stopPropagation();
									void form.handleSubmit();
								}}
							>
								<div className="grid gap-3">
									{/* Hidden input to include plan in form data for validation and submission */}
									<input type="hidden" id="plan" name="plan" value={userPlan} />

									<form.AppField
										name="name"
										children={(field) => (
											<field.TextField
												autoComplete="off"
												placeholder="Enter a name for your API key"
												id="name"
												label="Name"
												name="name"
												hint="This will be used to identify the API key in the API logs"
											/>
										)}
									/>
								</div>
							</form>
						)}
					</Modal.Body>

					<Modal.Footer>
						{!key && (
							<Modal.Close asChild>
								<Button
									$size="sm"
									$style="stroke"
									$type="neutral"
									className="w-full"
									disabled={form.state.isSubmitting}
									onClick={handleClose}
								>
									Cancel
								</Button>
							</Modal.Close>
						)}

						{key ? (
							<Modal.Close asChild>
								<Button
									$size="sm"
									className="w-full"
									$type="neutral"
									onClick={handleClose}
								>
									Yes, I saved it
								</Button>
							</Modal.Close>
						) : (
							<form.SubmitButton
								$size="sm"
								className="w-full"
								disabled={form.state.isSubmitting}
								form="create-api-key-form"
								type="submit"
							>
								{form.state.isSubmitting ? "Creating..." : "Create"}
							</form.SubmitButton>
						)}
					</Modal.Footer>
				</Modal.Content>
			</form.AppForm>
		</Modal.Root>
	);
}
