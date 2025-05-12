import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import aosCss from "aos/dist/aos.css?url";
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
				href: aosCss,
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
	component: RootComponent,
});

function RootComponent() {
	return (
		<ThemeProvider
			disableTransitionOnChange
			attribute={["class", "data-theme"]}
			defaultTheme="light"
		>
			<RootDocument>
				<Outlet />
			</RootDocument>
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
					href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body
				className="h-full bg-(--bg-white-0) text-(--text-strong-950)"
				suppressHydrationWarning
			>
				{children}
				<Toaster richColors />
				<TanStackRouterDevtools position="bottom-right" />
				<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
				<Scripts />
			</body>
		</html>
	);
}
