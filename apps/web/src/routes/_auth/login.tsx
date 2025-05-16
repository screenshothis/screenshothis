import LockPasswordIcon from "virtual:icons/hugeicons/lock-password";
import Mail01Icon from "virtual:icons/hugeicons/mail-01";
import UserIcon from "virtual:icons/hugeicons/user";

import { SignInSchema } from "@screenshothis/schemas/users";
import {
	Link,
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { AuthHeader } from "#/components/auth/auth-header.tsx";
import { useAppForm } from "#/components/forms/form.tsx";
import * as LinkButton from "#/components/ui/link-button.tsx";
import * as AlertToast from "#/components/ui/toast-alert.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authClient } from "#/lib/auth.ts";

export const Route = createFileRoute("/_auth/login")({
	validateSearch: zodValidator(
		z
			.object({
				redirect_to: z.string().optional(),
			})
			.optional(),
	),
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const search = useSearch({
		from: "/_auth/login",
	});
	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
			rememberMe: false,
		},
		async onSubmit({ value }) {
			await authClient.signIn.email(
				{
					...value,
					callbackURL: search?.redirect_to,
				},
				{
					onSuccess() {
						navigate({ to: "/dashboard" });

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
			onSubmit: SignInSchema,
		},
	});

	return (
		<>
			<AuthHeader
				icon={UserIcon}
				title="Login to your account"
				description="Enter your details to login."
			/>

			{/* TODO: enable when Google auth is enabled */}
			{/* <SocialLogin /> */}

			<form.AppForm>
				<form
					id="login-form"
					className="grid gap-6"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<div className="grid gap-3">
						<form.AppField
							name="email"
							children={(field) => (
								<field.TextField
									autoComplete="email"
									type="email"
									leadingIcon={Mail01Icon}
									placeholder="john@doe.com"
									inputMode="email"
									id="email"
									label="Email"
									name="email"
								/>
							)}
						/>

						<form.AppField
							name="password"
							children={(field) => (
								<field.PasswordField
									$size="md"
									label="Password"
									id="password"
									name="password"
									leadingIcon={LockPasswordIcon}
									autoComplete="current-password"
								/>
							)}
						/>
					</div>

					<div className="flex items-center justify-between gap-4">
						<form.AppField
							name="rememberMe"
							children={(field) => (
								<field.CheckboxField
									wrapperClassName="flex"
									label="Keep me logged in"
									id="rememberMe"
									labelClassName="order-last"
									name="rememberMe"
								/>
							)}
						/>

						<LinkButton.Root $style="gray" $size="md" $underline asChild>
							<Link to="/forgot-password">Forgot password?</Link>
						</LinkButton.Root>
					</div>

					<form.FancySubmitButton>
						{form.state.isSubmitting ? "Logging in..." : "Login"}
					</form.FancySubmitButton>
				</form>
			</form.AppForm>
		</>
	);
}
