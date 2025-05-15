import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMarkdown } from "@content-collections/markdown";

const legal = defineCollection({
	name: "legal",
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
			html,
		};
	},
});

export default defineConfig({
	collections: [legal],
});
