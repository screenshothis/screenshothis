import LegalDocument01Icon from "virtual:icons/hugeicons/legal-document-01";

import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setHeaders } from "@tanstack/react-start/server";
import { allLegals } from "content-collections";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { z } from "zod";

const fetchLegalPage = createServerFn({ method: "GET" })
	.validator(z.string().optional())
	.handler(async ({ data: legalPath }) => {
		if (!legalPath) {
			throw new Error("Invalid docs path");
		}

		const filePath = `src/content/legal/${legalPath}.md`;

		const post = allLegals.find((legal) => legal.slug === legalPath);

		if (!post) {
			throw notFound();
		}

		setHeaders({
			"cache-control": "public, max-age=0, must-revalidate",
			"cdn-cache-control": "max-age=300, stale-while-revalidate=300, durable",
		});

		const window = new JSDOM("").window;
		const DOMPurify = createDOMPurify(window);

		return {
			title: post.title,
			lastUpdated: post.lastUpdated,
			html: DOMPurify.sanitize(post.html),
			filePath,
		};
	});

export const Route = createFileRoute("/_marketing/legal/$")({
	staleTime: Number.POSITIVE_INFINITY,
	loader: ({ params }) => fetchLegalPage({ data: params._splat }),
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
						<time dateTime={new Date(lastUpdated).toISOString()}>
							{new Date(lastUpdated).toLocaleDateString("en-US", {
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
