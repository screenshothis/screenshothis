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
import { ThemeProvider } from "next-themes";

import { Toaster } from "#/components/ui/sonner.tsx";
import type { orpc } from "#/utils/orpc.ts";
import { seo } from "#/utils/seo.ts";
import appCss from "../app.css?url";
import tailwindCss from "../tailwind.css?url";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
}

const fetchClerkAuth = createServerFn({ method: "GET" }).handler(async () => {
	const request = getWebRequest();
	if (!request) throw new Error("No request found");

	const session = await getAuth(request);

	return {
		sessionId: session?.sessionId,
		userId: session?.userId,
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
		const { sessionId, userId } = await fetchClerkAuth();

		return {
			sessionId,
			userId,
		};
	},
	component: RootComponent,
});

function RootComponent() {
	return (
		<ThemeProvider
			disableTransitionOnChange
			attribute={["class", "data-theme"]}
			defaultTheme="light"
		>
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
				signUpFallbackRedirectUrl="/dashboard"
				signInFallbackRedirectUrl="/dashboard"
			>
				<RootDocument>
					<Outlet />
				</RootDocument>
			</ClerkProvider>
		</ThemeProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full antialiased" suppressHydrationWarning>
			<head>
				<HeadContent />

				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body className="h-full bg-(--bg-white-0)">
				{children}
				<Toaster richColors />
				<TanStackRouterDevtools position="bottom-left" />
				<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
				<Scripts />
			</body>
		</html>
	);
}
