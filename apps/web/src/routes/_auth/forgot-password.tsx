
import LockIcon from "virtual:icons/hugeicons/lock";
import Mail01Icon from "virtual:icons/hugeicons/mail-01";

import { ForgotPasswordSchema } from "@screenshothis/schemas/users";

import { AuthHeader } from "#/components/auth/auth-header.tsx";
import { useAppForm } from "#/components/forms/form.tsx";
import * as AlertToast from "#/components/ui/toast-alert.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authClient } from "#/lib/auth.ts";
import { getScreenshotUrl, seo } from "#/utils/seo.ts";

export const Route = createFileRoute({
	head({ match }) {
		return {
			meta: seo({
				title: "Forgot your password?",
				description: "Enter your email to reset your password.",
				image: getScreenshotUrl(`https://screenshothis.com${match.pathname}`),
			}),
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const form = useAppForm({
		defaultValues: {
			email: "",
		},
		async onSubmit({ value }) {
			await authClient.forgetPassword(
				{
					...value,
					redirectTo: "/reset-password",
				},
				{
					onSuccess() {
						toast.custom((t) => (
							<AlertToast.Root
								t={t}
								$status="success"
								$variant="filled"
								message="Reset link sent successfully"
							/>
						));

						form.reset();
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
			onSubmit: ForgotPasswordSchema,
		},
	});

	return (
		<>
			<AuthHeader
				icon={LockIcon}
				title="Forgot your password?"
				description="Enter your email to reset your password."
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
						name="email"
						children={(field) => (
							<field.TextField
								type="email"
								leadingIcon={Mail01Icon}
								placeholder="john@doe.com"
								inputMode="email"
								autoComplete="email"
								id="email"
								hint="Enter the email with which you've registered."
								label="Email address"
								name="email"
							/>
						)}
					/>

					<form.FancySubmitButton>
						{form.state.isSubmitting ? "Sending..." : "Send reset link"}
					</form.FancySubmitButton>
				</form>
			</form.AppForm>
		</>
	);
}
