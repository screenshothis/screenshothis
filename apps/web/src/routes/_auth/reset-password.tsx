import LockIcon from "virtual:icons/hugeicons/lock";
import LockPasswordIcon from "virtual:icons/hugeicons/lock-password";

import { ResetPasswordSchema } from "@screenshothis/schemas/users";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { AuthHeader } from "#/components/auth/auth-header.tsx";
import { useAppForm } from "#/components/forms/form.tsx";
import * as AlertToast from "#/components/ui/toast-alert.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authClient } from "#/lib/auth.ts";

export const Route = createFileRoute("/_auth/reset-password")({
	validateSearch: zodValidator(
		z.object({
			token: z.string({
				required_error: "Token is required",
			}),
		}),
	),
	component: RouteComponent,
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = useNavigate();
	const form = useAppForm({
		defaultValues: {
			newPassword: "",
		},
		async onSubmit({ value }) {
			await authClient.resetPassword(
				{
					...value,
					token: search.token,
				},
				{
					onSuccess() {
						toast.custom((t) => (
							<AlertToast.Root
								t={t}
								$status="success"
								$variant="filled"
								message="Password reset successfully"
							/>
						));

						form.reset();

						navigate({ to: "/login" });
					},
					onError({ error }) {
						toast.custom((t) => (
							<AlertToast.Root
								t={t}
								$status="error"
								$variant="filled"
								message={error.message}
							/>
						));
					},
				},
			);
		},
		validators: {
			onSubmit: ResetPasswordSchema,
		},
	});

	return (
		<>
			<AuthHeader
				icon={LockIcon}
				title="Reset your password"
				description="Enter your new password to reset your account."
			/>

			<form.AppForm>
				<form
					id="forgot-password-form"
					className="grid gap-6"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.AppField
						name="newPassword"
						children={(field) => (
							<field.PasswordField
								$size="md"
								label="Password"
								id="newPassword"
								name="newPassword"
								leadingIcon={LockPasswordIcon}
								autoComplete="new-password"
							/>
						)}
					/>

					<form.FancySubmitButton>
						{form.state.isSubmitting ? "Resetting..." : "Reset password"}
					</form.FancySubmitButton>
				</form>
			</form.AppForm>
		</>
	);
}
