import { ClerkProvider } from "@clerk/tanstack-react-start";
import { getAuth } from "@clerk/tanstack-react-start/server";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { Toaster } from "#/components/ui/sonner.tsx";
import { seo } from "#/utils/seo.ts";
import type { AppRouter } from "../../../server/src/routers";
import appCss from "../app.css?url";
import tailwindCss from "../tailwind.css?url";

export interface RouterAppContext {
	trpc: TRPCOptionsProxy<AppRouter>;
	queryClient: QueryClient;
}

const fetchClerkAuth = createServerFn({ method: "GET" }).handler(async () => {
	const request = getWebRequest();
	if (!request) throw new Error("No request found");

	const { userId } = await getAuth(request);

	return {
		userId,
	};
});

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "ScreenshoThis",
			},
			{
				name: "apple-mobile-web-app-title",
				content: "ScreenshoThis",
			},
			...seo({
				title: "ScreenshoThis",
			}),
		],
		links: [
			{
				rel: "icon",
				type: "image/png",
				href: "/favicon-96x96.png",
				sizes: "96x96",
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
			{
				rel: "shortcut icon",
				href: "/favicon.ico",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "manifest",
				href: "/site.webmanifest",
			},
			{
				rel: "stylesheet",
				href: tailwindCss,
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	beforeLoad: async () => {
		const { userId } = await fetchClerkAuth();

		return {
			userId,
		};
	},
	component: RootComponent,
});

function RootComponent() {
	return (
		<ClerkProvider
			appearance={{
				layout: {
					logoLinkUrl: "/",
				},
				variables: {
					colorPrimary: "#FF9147", // var(--color-primary)
					colorDanger: "#FB3748", // var(--color-red-500)
					colorSuccess: "#1FC16B", // var(--color-green-500)
					colorWarning: "#FF9147", // var(--color-orange-500)
					colorNeutral: "#0E121B", // var(--color-neutral-500)
					colorText: "#0E121B", // var(--color-neutral-950)
					colorTextOnPrimaryBackground: "#FFFFFF", // var(--color-neutral-0)
					colorTextSecondary: "#525866", // var(--color-neutral-600)
					colorBackground: "#F5F7FA", // var(--color-neutral-50)
					colorInputText: "#0E121B", // var(--color-neutral-950)
					colorInputBackground: "#FFFFFF", // var(--color-neutral-0)
					colorShimmer: "#EBF1FF", // var(--color-blue-50)
					fontFamily: "var(--default-font-sans)",
					fontFamilyButtons: "var(--default-font-sans)",
					borderRadius: "8px",
				},
			}}
		>
			<RootDocument>
				<Outlet />
			</RootDocument>
		</ClerkProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="h-full">
				{children}
				<Toaster richColors />
				<TanStackRouterDevtools position="bottom-left" />
				<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
				<Scripts />
			</body>
		</html>
	);
}
