import type { Page } from "puppeteer";

export interface ViewportInfo {
	pages: number;
	extraHeight: number;
	viewport: {
		height: number;
		width: number;
	};
}

export async function calculateViewport(page: Page): Promise<ViewportInfo> {
	const result = await page.evaluate(() => {
		window.scrollTo(0, 0);

		const pageHeight = document.documentElement.scrollHeight;

		// All measurements below are in CSS pixels to maintain consistency.
		return {
			pages: Math.ceil(pageHeight / window.innerHeight),
			extraHeight: Math.round(pageHeight % window.innerHeight),
			viewport: {
				height: Math.round(window.innerHeight),
				width: Math.round(window.innerWidth),
			},
		};
	});

	return result as ViewportInfo;
}
