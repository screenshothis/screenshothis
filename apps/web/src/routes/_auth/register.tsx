import LockPasswordIcon from "virtual:icons/hugeicons/lock-password";
import Mail01Icon from "virtual:icons/hugeicons/mail-01";
import UserAdd01Icon from "virtual:icons/hugeicons/user-add-01";
import GoogleLogo from "virtual:icons/logos/google-icon";

import { SignUpSchema } from "@screenshothis/schemas/users";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useAppForm } from "#/components/forms/form.tsx";
import * as Divider from "#/components/ui/divider.tsx";
import * as SocialButton from "#/components/ui/social-buttons.tsx";
import * as AlertToast from "#/components/ui/toast-alert.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authClient } from "#/lib/auth.ts";
import { cn } from "#/utils/cn.ts";

export const Route = createFileRoute("/_auth/register")({
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
			<div className="flex flex-col items-center space-y-2">
				{/* icon */}
				<div
					className={cn(
						"relative flex size-[68px] shrink-0 items-center justify-center rounded-full backdrop-blur-xl lg:size-20",
						// bg
						"before:absolute before:inset-0 before:rounded-full",
						"before:bg-gradient-to-b before:from-primary before:to-transparent before:opacity-10",
					)}
				>
					<div
						className="relative z-10 flex size-12 items-center justify-center rounded-full bg-(--bg-white-0) ring-(--stroke-soft-200) ring-1 ring-inset lg:size-14"
						style={{
							boxShadow:
								"0 0 0 1px rgba(183, 83, 16, 0.04), 0 1px 1px 0.5px rgba(183, 83, 16, 0.04), 0 3px 3px -1.5px rgba(183, 83, 16, 0.02), 0 6px 6px -3px rgba(183, 83, 16, 0.04), 0 12px 12px -6px rgba(183, 83, 16, 0.04), 0px 24px 24px -12px rgba(183, 83, 16, 0.04), 0px 48px 48px -24px rgba(183, 83, 16, 0.04), inset 0px -1px 1px -0.5px rgba(183, 83, 16, 0.06)",
						}}
					>
						<UserAdd01Icon className="size-6 text-state-warning-base lg:size-7" />
					</div>
				</div>

				<div className="space-y-1 text-center">
					<div className="text-h6 lg:text-h5">Create a new account</div>
					<div className="text-(--text-sub-600) text-paragraph-sm lg:text-paragraph-md">
						Enter your details to register.
					</div>
				</div>
			</div>

			<div className="grid w-full auto-cols-fr grid-flow-col gap-3">
				<SocialButton.Root $mode="stroke" $brand="google">
					<SocialButton.Icon as={GoogleLogo} />
					Continue with Google
				</SocialButton.Root>
			</div>

			<Divider.Root $type="line-text">OR</Divider.Root>

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
