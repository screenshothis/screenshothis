import { } from '@tanstack/react-router'
import LockPasswordIcon from "virtual:icons/hugeicons/lock-password";
import Mail01Icon from "virtual:icons/hugeicons/mail-01";
import UserAdd01Icon from "virtual:icons/hugeicons/user-add-01";

import { SignUpSchema } from "@screenshothis/schemas/users";
import { useNavigate } from "@tanstack/react-router";

import { AuthHeader } from "#/components/auth/auth-header.tsx";
import { SocialLogin } from "#/components/auth/social-login.tsx";
import { useAppForm } from "#/components/forms/form.tsx";
import * as AlertToast from "#/components/ui/toast-alert.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authClient } from "#/lib/auth.ts";
import { getScreenshotUrl, seo } from "#/utils/seo.ts";

export const Route = createFileRoute({
	head({ match }) {
		return {
			meta: seo({
				title: "Create a new account",
				description: "Enter your details to register.",
				image: getScreenshotUrl(`https://screenshothis.com${match.pathname}`),
			}),
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const form = useAppForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		async onSubmit({ value }) {
			await authClient.signUp.email(value, {
				onSuccess() {
					navigate({ to: "/dashboard" });

					toast.custom((t) => (
						<AlertToast.Root
							t={t}
							$status="success"
							$variant="filled"
							message="Account created successfully"
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
			});
		},
		validators: {
			onSubmit: SignUpSchema,
		},
	});

	return (
		<>
			<AuthHeader
				icon={UserAdd01Icon}
				title="Create a new account"
				description="Enter your details to register."
			/>

			<SocialLogin />

			<form.AppForm>
				<form
					id="register-form"
					className="grid gap-6"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<div className="grid gap-3">
						<form.AppField
							name="name"
							children={(field) => (
								<field.TextField
									label="Full name"
									id="name"
									name="name"
									placeholder="John Doe"
									autoComplete="name"
								/>
							)}
						/>

						<form.AppField
							name="email"
							children={(field) => (
								<field.TextField
									type="email"
									leadingIcon={Mail01Icon}
									placeholder="john@doe.com"
									inputMode="email"
									id="email"
									label="Email"
									name="email"
									autoComplete="email"
								/>
							)}
						/>

						<form.AppField
							name="password"
							children={(field) => (
								<field.PasswordField
									$size="md"
									label="Password"
									hint="Must contain 1 uppercase letter, 1 number, min. 8 characters."
									id="password"
									name="password"
									leadingIcon={LockPasswordIcon}
									autoComplete="new-password"
								/>
							)}
						/>
					</div>

					<form.FancySubmitButton>
						{form.state.isSubmitting ? "Creating account..." : "Create account"}
					</form.FancySubmitButton>
				</form>
			</form.AppForm>
		</>
	);
}
