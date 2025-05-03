import { SignOutButton, useUser } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";

import * as Button from "./ui/button.tsx";
import * as DropdownMenu from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton.tsx";

export default function UserMenu() {
	const { user, isLoaded, isSignedIn } = useUser();

	if (!isLoaded) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!isSignedIn) {
		return (
			<Button.Root $style="stroke" asChild>
				<Link to="/login/$">Sign In</Link>
			</Button.Root>
		);
	}

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<Button.Root $style="stroke">{user?.fullName}</Button.Root>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content className="bg-card">
				<DropdownMenu.Label>My Account</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>
					{user?.emailAddresses[0].emailAddress}
				</DropdownMenu.Item>
				<DropdownMenu.Item asChild>
					<SignOutButton>
						<Button.Root $type="error" className="w-full">
							Sign Out
						</Button.Root>
					</SignOutButton>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	);
}
