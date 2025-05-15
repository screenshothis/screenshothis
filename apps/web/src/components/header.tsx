import Menu02Icon from "virtual:icons/hugeicons/menu-02";

import { Link } from "@tanstack/react-router";
import * as React from "react";

import { useScroll } from "#/hooks/use-scroll.ts";
import { authClient } from "#/lib/auth.ts";
import { cn } from "#/utils/cn.ts";
import { Logo } from "./logo.tsx";
import { Button } from "./ui/button.tsx";
import * as Drawer from "./ui/drawer.tsx";
import * as LinkButton from "./ui/link-button.tsx";
import { Skeleton } from "./ui/skeleton.tsx";

const navItems = [
	{
		label: "Home",
		href: "/",
	},
	{
		label: "Features",
		href: "/#features",
	},
	{
		label: "Pricing",
		href: "/pricing",
	},
];

const mobileNavItems = [
	...navItems,
	{ label: "Changelog", href: "/changelog" },
	{
		label: "Login",
		href: "/login",
	},
	{
		label: "Register",
		href: "/register",
	},
];

export function Header() {
	const { data: session, isPending } = authClient.useSession();
	const { scrollY } = useScroll();

	return (
		<div
			className={cn(
				"fixed top-0 left-0 z-50 flex w-full items-center justify-center px-2 transition-all duration-300 lg:inset-x-0 lg:px-0",
				scrollY > 64
					? "h-16 lg:bg-(--bg-white-0)/80 lg:shadow-sm lg:backdrop-blur-sm"
					: "h-16 lg:h-20",
			)}
		>
			<div
				className={cn(
					"container mx-px flex max-w-6xl items-center justify-between border border-t-0 ring-inset transition-all duration-300 lg:mx-0 lg:px-8",
					scrollY > 64
						? "h-16 bg-(--bg-white-0) lg:border-0 lg:bg-transparent"
						: "h-16 border-x bg-(--bg-white-0) lg:h-20",
				)}
			>
				<div className="flex flex-row items-center justify-between">
					<Link to="/" className="flex items-center gap-2">
						<Logo className="h-8 w-auto text-primary" />
						<span className="font-semibold">ScreenshotThis</span>
					</Link>
				</div>

				<div className="flex items-center gap-10">
					<ul className="hidden items-center gap-10 lg:flex">
						{navItems.map((item) => (
							<li key={item.href}>
								<LinkButton.Root
									asChild
									className="aria-[current=page]:decoration-current"
								>
									<Link to={item.href}>{item.label}</Link>
								</LinkButton.Root>
							</li>
						))}
					</ul>

					<div className="flex items-center gap-2">
						<MobileMenu />

						{isPending ? (
							<Skeleton className="h-8 min-w-32" />
						) : (
							<Button asChild $type="neutral" $size="sm">
								<Link to={session ? "/dashboard" : "/register"}>
									{session ? "Dashboard" : "Get started now"}
								</Link>
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function MobileMenu() {
	const [isOpen, setOpen] = React.useState(false);

	return (
		<Drawer.Root onOpenChange={setOpen} open={isOpen}>
			<Drawer.Trigger asChild>
				<Button
					leadingIcon={Menu02Icon}
					$style="ghost"
					$type="neutral"
					className="lg:hidden"
					onClick={() => setOpen(!isOpen)}
				>
					<span className="sr-only">Open menu</span>
				</Button>
			</Drawer.Trigger>

			<Drawer.Content className="max-w-full">
				<Drawer.Header>
					<Link to="/">
						<Logo className="h-8 w-auto" />
					</Link>
					<Drawer.Title className="sr-only">Menu</Drawer.Title>
					<Drawer.Description className="sr-only">
						This menu provides mobile navigation options for the marketing site.
					</Drawer.Description>
				</Drawer.Header>

				<Drawer.Body className="flex w-full flex-col gap-5 p-6">
					<ul className="flex flex-col gap-5">
						{mobileNavItems.map((item) => (
							<li key={item.href}>
								<LinkButton.Root
									asChild
									className="text-paragraph-lg aria-[current=page]:decoration-current"
									onClick={() => setOpen(false)}
								>
									<Link to={item.href}>{item.label}</Link>
								</LinkButton.Root>
							</li>
						))}
					</ul>
				</Drawer.Body>
			</Drawer.Content>
		</Drawer.Root>
	);
}
