import { } from '@tanstack/react-router'
import LegalDocument01Icon from "virtual:icons/hugeicons/legal-document-01";

import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setHeaders } from "@tanstack/react-start/server";
import { allLegalPages } from "content-collections";
import { z } from "zod";

import { getScreenshotUrl, seo } from "#/utils/seo.ts";

const fetchLegalPage = createServerFn({ method: "GET" })
	.validator(z.string().optional())
	.handler(async ({ data: legalPath }) => {
		if (!legalPath) {
			throw new Error("Invalid docs path");
		}

		const filePath = `src/content/legal/${legalPath}.md`;

		const page = allLegalPages.find((legal) => legal.slug === legalPath);

		if (!page) {
			throw notFound();
		}

		setHeaders({
			"cache-control": "public, max-age=0, must-revalidate",
			"cdn-cache-control": "max-age=300, stale-while-revalidate=300, durable",
		});

		return {
			title: page.title,
			lastUpdated: page.lastUpdated,
			excerpt: page.excerpt,
			html: page.html,
			filePath,
		};
	});

export const Route = createFileRoute({
	staleTime: Number.POSITIVE_INFINITY,
	loader: ({ params }) => fetchLegalPage({ data: params._splat }),
	head: ({ loaderData, match }) => {
		return {
			meta: loaderData
				? [
						...seo({
							title: `${loaderData?.title ?? "Legal"} | Screenshothis`,
							description: loaderData?.excerpt,
							image: getScreenshotUrl(
								`https://screenshothis.com${match.pathname}`,
							),
						}),
					]
				: [],
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { title, lastUpdated, html } = Route.useLoaderData();

	return (
		<section className="px-2">
			<div className="container max-w-6xl border-x bg-(--bg-white-0) pt-32 pb-12 lg:px-12">
				<div className="mx-auto max-w-xl">
					<p className="inline-flex items-center gap-2 font-medium text-paragraph-xs uppercase">
						<LegalDocument01Icon className="size-4 text-primary" />
						<time dateTime={lastUpdated.toISOString()}>
							{lastUpdated.toLocaleDateString("en-US", {
								day: "numeric",
								year: "numeric",
								month: "long",
							})}
						</time>
					</p>

					<h3 className="mt-8 font-bold text-h5 tracking-tight lg:text-h4">
						{title}
					</h3>
					<p className="mt-2 text-(--text-sub-600)">
						Contact us with any questions about these agreements.
					</p>
				</div>
			</div>

			<div className="container max-w-6xl border-x border-t bg-(--bg-white-0) py-12 lg:px-12">
				<div
					className="prose dark:prose-invert mx-auto mt-6 w-full max-w-xl overflow-hidden prose-pre:rounded-12 prose-pre:border prose-a:border-primary prose-a:border-b prose-a:border-dashed prose-headings:font-semibold prose-blockquote:text-(--text-sub-600) text-(--text-sub-600) prose-a:no-underline prose-a:transition-colors prose-a:duration-200 prose-ul:[list-style-type:'○'] prose-li:marker:text-brand-primary-600 prose-a:hover:border-solid prose-a:hover:bg-brand-primary-200"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: we sanitize the HTML in the loader
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			</div>
		</section>
	);
}
