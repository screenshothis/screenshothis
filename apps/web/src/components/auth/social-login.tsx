import GoogleLogo from "virtual:icons/logos/google-icon";

import * as Divider from "../ui/divider.tsx";
import * as SocialButton from "../ui/social-button";

export function SocialLogin() {
	return (
		<>
			<div className="grid w-full auto-cols-fr grid-flow-col gap-3">
				<SocialButton.Root $mode="stroke" $brand="google">
					<SocialButton.Icon as={GoogleLogo} />
					Continue with Google
				</SocialButton.Root>
			</div>

			<Divider.Root $type="line-text">OR</Divider.Root>
		</>
	);
}
