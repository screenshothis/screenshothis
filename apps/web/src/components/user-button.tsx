"use client";

import ArrowDown01Icon from "virtual:icons/hugeicons/arrow-down-01";
import ArrowRight01Icon from "virtual:icons/hugeicons/arrow-right-01";
import CustomerSupportIcon from "virtual:icons/hugeicons/customer-support";
import Logout04Icon from "virtual:icons/hugeicons/logout-04";
import Moon02Icon from "virtual:icons/hugeicons/moon-02";
import SecurityCheckIcon from "virtual:icons/hugeicons/security-check";
import Setting07Icon from "virtual:icons/hugeicons/setting-07";
import UserCircle02Icon from "virtual:icons/hugeicons/user-circle-02";

import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTheme } from "next-themes";

import { useORPC } from "#/hooks/use-orpc.ts";
import { authClient } from "#/lib/auth.ts";
import { useSettingsStore } from "#/store/settings.ts";
import { cn } from "#/utils/cn.ts";
import * as Avatar from "./ui/avatar.tsx";
import * as Divider from "./ui/divider.tsx";
import * as DropdownMenu from "./ui/dropdown-menu.tsx";
import { Skeleton } from "./ui/skeleton.tsx";
import * as Switch from "./ui/switch.tsx";

export function UserButton({ className }: { className?: string }) {
	const orpc = useORPC();
	const { data: me } = useQuery(orpc.users.me.queryOptions());
	const { theme, setTheme } = useTheme();
	const navigate = useNavigate();
	const { setOpen } = useSettingsStore();

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				className={cn(
					"flex w-full items-center gap-3 whitespace-nowrap rounded-10 p-3 text-left outline-none hover:bg-(--bg-weak-50) focus:outline-none",
					className,
				)}
			>
				{me ? (
					<Avatar.Root
						className="fade-in animate-in duration-300"
						$color="blue"
						$size="40"
					>
						{me.imageUrl ? (
							<Avatar.Image
								alt={me.fullName ?? ""}
								src={me.imageUrl ?? undefined}
							/>
						) : null}
					</Avatar.Root>
				) : (
					<Skeleton className="size-10 rounded-full" />
				)}

				<div
					className="flex w-[172px] shrink-0 items-center gap-3"
					data-hide-collapsed
				>
					<div className="flex-1 space-y-1">
						{me ? (
							<div className="fade-in flex animate-in items-center gap-0.5 text-label-sm duration-300">
								{me.fullName}
							</div>
						) : (
							<Skeleton className="h-5" />
						)}

						{me ? (
							<div className="fade-in animate-in truncate text-(--text-sub-600) text-paragraph-xs duration-300">
								{me.email}
							</div>
						) : (
							<Skeleton className="h-4" />
						)}
					</div>

					<div className="flex size-6 items-center justify-center rounded-6">
						<ArrowRight01Icon className="size-5 text-(--text-sub-600)" />
					</div>
				</div>
			</DropdownMenu.Trigger>

			<DropdownMenu.Content align="end" side="right" sideOffset={24}>
				<DropdownMenu.Item
					onSelect={(e) => {
						e.preventDefault();
						setTheme(theme === "dark" ? "light" : "dark");
					}}
				>
					<DropdownMenu.ItemIcon as={Moon02Icon} />
					Dark Mode
					<span className="flex-1" />
					<Switch.Root checked={theme === "dark"} />
				</DropdownMenu.Item>

				<Divider.Root $type="line-spacing" />

				<DropdownMenu.Group>
					<DropdownMenu.Item asChild>
						<Link to="/">
							<DropdownMenu.ItemIcon as={UserCircle02Icon} />
							My profile
						</Link>
					</DropdownMenu.Item>
					<DropdownMenu.Item onClick={setOpen}>
						<DropdownMenu.ItemIcon as={Setting07Icon} />
						Settings
					</DropdownMenu.Item>
				</DropdownMenu.Group>

				<Divider.Root $type="line-spacing" />

				<DropdownMenu.Group>
					<DropdownMenu.Item
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										navigate({
											to: "/",
										});
									},
								},
							});
						}}
					>
						<DropdownMenu.ItemIcon as={Logout04Icon} />
						Logout
					</DropdownMenu.Item>
				</DropdownMenu.Group>

				<div className="p-2 text-(--text-soft-400) text-paragraph-sm">
					<span>v1.0.0 · </span>
					<Link
						to="/legal/$"
						params={{
							_splat: "terms",
						}}
					>
						Terms & Conditions
					</Link>
				</div>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	);
}

export function UserButtonMobile({ className }: { className?: string }) {
	const { theme, setTheme } = useTheme();
	const orpc = useORPC();
	const { data: me } = useQuery(orpc.users.me.queryOptions());
	const navigate = useNavigate();
	const { setOpen } = useSettingsStore();

	return (
		<DropdownMenu.Root modal={false}>
			<DropdownMenu.Trigger
				className={cn(
					"group flex w-full items-center gap-3 whitespace-nowrap rounded-10 p-3 text-left outline-none hover:bg-(--bg-weak-50) focus:outline-none",
					className,
				)}
			>
				<Avatar.Root $color="blue" $size="48">
					{me?.imageUrl ? (
						<Avatar.Image
							alt={me?.fullName ?? ""}
							src={me?.imageUrl ?? undefined}
						/>
					) : (
						me?.fullName?.slice(0, 2)
					)}
				</Avatar.Root>
				<div className="flex-1 space-y-1">
					<div className="flex items-center gap-0.5 text-label-md">
						{me?.fullName}
					</div>
					<div className="truncate text-(--text-sub-600) text-paragraph-sm">
						{me?.email}
					</div>
				</div>
				<div
					className={cn(
						"flex size-6 items-center justify-center rounded-6 border border-(--stroke-soft-200) bg-(--bg-white-0) text-(--text-sub-600) shadow-xs",
						// open
						"group-data-[state=open]:bg-(--bg-strong-950) group-data-[state=open]:text-(--text-white-0) group-data-[state=open]:shadow-none",
					)}
				>
					<ArrowDown01Icon className="group-data-[state=open]:-rotate-180 size-5" />
				</div>
			</DropdownMenu.Trigger>

			<DropdownMenu.Content align="end" side="top">
				<DropdownMenu.Item
					onSelect={(e) => {
						e.preventDefault();
						setTheme(theme === "dark" ? "light" : "dark");
					}}
				>
					<DropdownMenu.ItemIcon as={Moon02Icon} />
					Dark Mode
					<span className="flex-1" />
					<Switch.Root checked={theme === "dark"} />
				</DropdownMenu.Item>

				<Divider.Root $type="line-spacing" />

				<DropdownMenu.Group>
					<DropdownMenu.Item asChild>
						<Link to="/">
							<DropdownMenu.ItemIcon as={UserCircle02Icon} />
							My profile
						</Link>
					</DropdownMenu.Item>
					<DropdownMenu.Item onClick={setOpen}>
						<DropdownMenu.ItemIcon as={Setting07Icon} />
						Settings
					</DropdownMenu.Item>
					<DropdownMenu.Item asChild>
						<Link
							to="/legal/$"
							params={{
								_splat: "policy",
							}}
						>
							<DropdownMenu.ItemIcon as={SecurityCheckIcon} />
							Privacy policy
						</Link>
					</DropdownMenu.Item>
					<DropdownMenu.Item asChild>
						<a
							href="mailto:support@expensetrackr.app"
							rel="noopener noreferrer"
							target="_blank"
						>
							<DropdownMenu.ItemIcon as={CustomerSupportIcon} />
							Support
						</a>
					</DropdownMenu.Item>
				</DropdownMenu.Group>

				<Divider.Root $type="line-spacing" />

				<DropdownMenu.Group>
					<DropdownMenu.Item
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										navigate({
											to: "/",
										});
									},
								},
							});
						}}
					>
						<DropdownMenu.ItemIcon as={Logout04Icon} />
						Logout
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	);
}
