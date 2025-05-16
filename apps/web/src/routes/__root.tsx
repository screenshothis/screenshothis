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
import aosCss from "aos/dist/aos.css?url";
import { LazyMotion, domAnimation } from "motion/react";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

import { Toaster } from "#/components/ui/toast.tsx";
import { authClient } from "#/lib/auth.ts";
import type { orpc } from "#/utils/orpc.ts";
import { getScreenshotUrl, seo } from "#/utils/seo.ts";
import appCss from "../app.css?url";
import tailwindCss from "../tailwind.css?url";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
}

export const authStateFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const request = getWebRequest();
		if (!request)
			throw new Error("No request found in current execution context");
		const { data } = await authClient.getSession({
			fetchOptions: {
				headers: {
					cookie: request.headers.get("cookie") || "",
				},
			},
		});

		return data;
	},
);

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: ({ match }) => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Screenshothis",
			},
			{
				name: "apple-mobile-web-app-title",
				content: "Screenshothis",
			},
			{
				property: "og:url",
				content: `https://screenshothis.com${match.pathname}`,
			},
			{
				property: "og:site_name",
				content: "Screenshothis",
			},
			...seo({
				image: getScreenshotUrl(`https://screenshothis.com${match.pathname}`),
			}),
		],
		links: [
			{
				rel: "canonical",
				href: `https://screenshothis.com${match.pathname}`,
			},
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
	async beforeLoad() {
		const session = await authStateFn();

		return {
			session: session
				? {
						...session.session,
						user: session.user,
					}
				: null,
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
			<RootDocument>
				<NuqsAdapter>
					<LazyMotion features={domAnimation}>
						<Outlet />
					</LazyMotion>
				</NuqsAdapter>
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

				<Toaster position="top-center" />
				<TanStackRouterDevtools position="bottom-right" />
				<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
				<Scripts />
			</body>
		</html>
	);
}
