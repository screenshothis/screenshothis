import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";

import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { Session, User } from "better-auth";
import { LazyMotion, domAnimation } from "motion/react";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/react";

import { authStateFn } from "#/actions/get-auth-state.ts";
import { Toaster } from "#/components/ui/toast.tsx";
import { env } from "#/utils/env.ts";
import type { orpc } from "#/utils/orpc.ts";
import { getScreenshotUrl, seo } from "#/utils/seo.ts";
import appCss from "../app.css?url";
import tailwindCss from "../tailwind.css?url";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
	session: (Session & { user: User }) | null;
}

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
				href: `/favicon-96x96.png?v=${env.VITE_SOURCE_COMMIT}`,
				sizes: "96x96",
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: `/favicon.svg?v=${env.VITE_SOURCE_COMMIT}`,
			},
			{
				rel: "shortcut icon",
				href: `/favicon.ico?v=${env.VITE_SOURCE_COMMIT}`,
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: `/apple-touch-icon.png?v=${env.VITE_SOURCE_COMMIT}`,
			},
			{
				rel: "manifest",
				href: `/site.webmanifest?v=${env.VITE_SOURCE_COMMIT}`,
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
		scripts: [
			{
				children: `
					window.ENV = {
						SOURCE_COMMIT: "${env.VITE_SOURCE_COMMIT}",
					}
				`,
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
				<NuqsAdapter fullPageNavigationOnShallowFalseUpdates>
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
				<script
					defer
					data-domain="screenshothis.com"
					src="https://athena.danestves.com/js/script.hash.outbound-links.pageview-props.tagged-events.js"
				/>
			</body>
		</html>
	);
}
