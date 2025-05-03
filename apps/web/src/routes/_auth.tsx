import bash from "@shikijs/langs/bash";
import catppuccinFrappe from "@shikijs/themes/catppuccin-frappe";
import {
	Link,
	Outlet,
	createFileRoute,
	redirect,
	useLocation,
} from "@tanstack/react-router";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine, loadWasm } from "shiki/engine/oniguruma";

import { LanguageSelect } from "#/components/language-select.tsx";
import * as Button from "#/components/ui/button.tsx";

// @ts-expect-error - wasm doesn't have types
await loadWasm(import("shiki/onig.wasm"));

type PathConfig = {
	message: string;
	linkText: string;
	linkHref: string;
};

const pathConfig: Record<string, PathConfig> = {
	"/login": {
		message: "Don't have an account?",
		linkText: "Register",
		linkHref: "/register",
	},
	"/register": {
		message: "Already have an account?",
		linkText: "Login",
		linkHref: "/login",
	},
	"/reset-password": {
		message: "Changed your mind?",
		linkText: "Go back",
		linkHref: "/",
	},
};

const defaultConfig: PathConfig = {
	message: "Changed your mind?",
	linkText: "Go back",
	linkHref: "/",
};

export const Route = createFileRoute("/_auth")({
	async beforeLoad({ context }) {
		if (context.userId) {
			throw redirect({
				to: "/dashboard",
			});
		}
	},
	async loader() {
		const highlighter = await createHighlighterCore({
			themes: [catppuccinFrappe],
			langs: [bash],
			engine: createOnigurumaEngine(import("shiki/wasm")),
		});

		const code = highlighter.codeToHtml(
			`curl -G https://api.screenshothis.com/v1/take?url=https://example.com \

  -H "Authorization: Bearer {token}" \
`,
			{
				lang: "bash",
				theme: "catppuccin-frappe",
			},
		);

		return {
			code,
		};
	},
	component: PathlessLayoutComponent,
});

function PathlessLayoutComponent() {
	const { code } = Route.useLoaderData();

	return (
		<div
			className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_500px] xl:grid-cols-[minmax(0,1fr)_596px] min-[1440px]:grid-cols-[minmax(0,844fr)_minmax(0,596fr)]"
			style={{
				background:
					"linear-gradient(180deg, #CA5F16 0%, #DC6818 25%, #E97D35 50%, #F1AC7E 75%, #F9DCC8 100%), #FFFFFF",
			}}
		>
			<div className="flex h-full flex-col p-1.5 lg:p-2 lg:pr-0">
				<div className="flex flex-1 flex-col rounded-16 bg-(--bg-white-0) px-3.5 lg:px-11 lg:py-6">
					<AuthHeader />

					<div className="flex flex-1 flex-col py-6 lg:py-[100px] [@media_(min-height:901px)]:justify-center">
						<div className="mx-auto flex w-full max-w-[392px] flex-col gap-6 md:translate-x-1.5">
							<Outlet />
						</div>
					</div>

					{/* Footer */}
					<div className="mt-auto flex items-center justify-between gap-4 pb-4 lg:pb-0">
						<div className="text-(--text-sub-600) text-paragraph-sm">
							© {new Date().getFullYear()} ScreenshotThis
						</div>

						<LanguageSelect />
					</div>
				</div>
			</div>

			<div className="hidden lg:block">
				<div className="relative size-full">
					<div className="relative flex h-full flex-col items-center justify-center">
						<section className="relative w-full max-w-[452px] pb-11">
							<div className="flex w-full flex-col gap-10 px-6">
								<div className="text-h5 text-white/[.72]">
									<span className="text-white">
										Taking screenshots programatically has never been easier.
									</span>{" "}
									Take screenshots of your website programatically using a
									simple API.
								</div>

								<div className="relative overflow-x-auto">
									{/* biome-ignore lint/security/noDangerouslySetInnerHtml: we control the code */}
									<div dangerouslySetInnerHTML={{ __html: code }} />
								</div>
							</div>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
}

function DynamicContent({ pathname }: { pathname: string }) {
	const { message, linkText, linkHref } = pathConfig[pathname] || defaultConfig;

	return (
		<>
			<span className="text-right text-paragraph-sm text-text-sub-600">
				{message}
			</span>
			<Button.Root $type="primary" $style="lighter" $size="xs" asChild>
				<Link to={linkHref}>{linkText}</Link>
			</Button.Root>
		</>
	);
}

export default function AuthHeader() {
	const pathname = useLocation().pathname;

	console.info(pathname);

	return (
		<div className="mx-auto flex w-full items-center justify-between gap-6 py-3.5 lg:py-0">
			<Link to="/" className="shrink-0">
				<img
					src="/ios-icon.png"
					alt=""
					width={32}
					height={32}
					className="size-8"
				/>
			</Link>
			<div className="flex items-center gap-3">
				<DynamicContent pathname={pathname} />
			</div>
		</div>
	);
}
