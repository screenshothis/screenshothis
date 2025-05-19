"use client";

import Loading03Icon from "virtual:icons/hugeicons/loading-03";
import GoogleLogo from "virtual:icons/logos/google-icon";

import * as React from "react";

import { authClient } from "#/lib/auth.ts";
import { cn } from "#/utils/cn.ts";
import { env } from "#/utils/env.client.ts";
import * as Divider from "../ui/divider.tsx";
import * as SocialButton from "../ui/social-button.tsx";
import * as AlertToast from "../ui/toast-alert.tsx";
import { toast } from "../ui/toast.tsx";

const providers = [
	{
		label: "Continue with Google",
		icon: GoogleLogo,
		provider: "google",
	},
] as const;

export function SocialLogin() {
	const [isSubmitting, setSubmitting] = React.useState(false);
	const [selectedProvider, setSelectedProvider] = React.useState<
		(typeof providers)[number]["provider"] | null
	>(null);

	const handleLogin = async (provider: "google") => {
		setSubmitting(true);
		setSelectedProvider(provider);

		try {
			const socialParams = {
				provider: provider,
				callbackURL: `${env.VITE_SERVER_URL}/auth/callback/${provider}`,
				fetchOptions: { throw: true },
			};

			await authClient.signIn.social(socialParams);
		} catch (error) {
			toast.custom((t) => (
				<AlertToast.Root
					t={t}
					$status="error"
					$variant="filled"
					message={
						error instanceof Error ? error.message : "An unknown error occurred"
					}
				/>
			));

			setSubmitting(false);
			setSelectedProvider(null);
		}
	};

	return (
		<>
			<div className="grid w-full auto-cols-fr grid-flow-col gap-3">
				{providers.map((provider) => (
					<SocialButton.Root
						key={provider.provider}
						$mode="stroke"
						$brand={provider.provider}
						disabled={isSubmitting}
						onClick={() => handleLogin(provider.provider)}
					>
						<SocialButton.Icon as={provider.icon} />

						<span
							className={cn(
								isSubmitting &&
									selectedProvider !== provider.provider &&
									"invisible",
							)}
						>
							{selectedProvider === provider.provider
								? "Signing in..."
								: provider.label}
						</span>

						{isSubmitting && selectedProvider === provider.provider ? (
							<div className="-translate-1/2 absolute top-1/2 left-1/2">
								<Loading03Icon className="size-5 animate-spin" />
							</div>
						) : null}
					</SocialButton.Root>
				))}
			</div>

			<Divider.Root $type="line-text">OR</Divider.Root>
		</>
	);
}
