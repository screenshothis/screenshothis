import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMarkdown } from "@content-collections/markdown";

import { createExcerpt } from "#/actions/create-excerpt.ts";

const legalPages = defineCollection({
	name: "legalPages",
	directory: "src/content/legal",
	include: "**/*.md",
	schema: (z) => ({
		title: z.string(),
		lastUpdated: z.string(),
	}),
	async transform(document, context) {
		const html = await compileMarkdown(context, document);

		return {
			...document,
			slug: document._meta.path,
			excerpt: createExcerpt(document.content),
			html,
		};
	},
});

export default defineConfig({
	collections: [legalPages],
});
