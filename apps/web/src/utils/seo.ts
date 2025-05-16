export const getScreenshotUrl = (url: string) => {
	return `https://api.screenshothis.com/v1/screenshots/take?api_key=ss_live_USkpHQPzxXlkFHrUxhkZBHxoGwmyXfLKqltFiYvXSLpOnvkjgXIWMdboeNRdlrMA&url=${url}&width=1200&height=630&device_scale_factor=0.75&block_ads=true&block_cookie_banners=true&block_trackers=true&prefers_color_scheme=light&prefers_reduced_motion=reduce`;
};

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
		{ name: "twitter:creator", content: "@danestves" },
		{ name: "twitter:site", content: "@danestves" },
		{ property: "og:type", content: "website" },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		...(image
			? [
					{ name: "twitter:image", content: image },
					{ name: "twitter:card", content: "summary_large_image" },
					{ property: "og:image", content: image },
				]
			: []),
	];

	return tags;
};
