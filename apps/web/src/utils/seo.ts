export const seo = ({
	title = "Screenshot API: Capture, Automate & Integrate | Screenshothis",
	description = "Screenshothis provides a robust screenshot API to effortlessly capture web pages, automate visual content, and integrate screenshots into your apps. Your all-in-one solution for programmatic image generation.",
	keywords,
	image,
}: {
	title?: string;
	description?: string;
	image?: string;
	keywords?: string;
}) => {
	const tags = [
		{ title },
		{ name: "description", content: description },
		{ name: "keywords", content: keywords },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:creator", content: "@screenshothis" },
		{ name: "twitter:site", content: "@screenshothis" },
		{ name: "og:type", content: "website" },
		{ name: "og:title", content: title },
		{ name: "og:description", content: description },
		...(image
			? [
					{ name: "twitter:image", content: image },
					{ name: "twitter:card", content: "summary_large_image" },
					{ name: "og:image", content: image },
				]
			: []),
	];

	return tags;
};
