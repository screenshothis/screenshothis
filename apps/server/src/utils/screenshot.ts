import type { Page } from "puppeteer";

export async function scrollDown(
	page: Page,
	options: { fullPageScrollDuration?: number; maxIterations?: number } = {},
) {
	const { fullPageScrollDuration = 5_000, maxIterations = 1_000 } = options;

	await page.evaluate(
		async ({ fullPageScrollDuration, maxIterations }) => {
			await new Promise((resolve) => {
				let totalHeight = 0;
				const distance = 100;
				let iterations = 0;
				const startTime = Date.now();

				const timer = setInterval(() => {
					const scrollHeight = document.body.scrollHeight;
					window.scrollBy(0, distance);
					totalHeight += distance;
					iterations += 1;

					const durationExceeded =
						Date.now() - startTime >= fullPageScrollDuration;
					const iterationsExceeded = iterations >= maxIterations;

					if (
						totalHeight >= scrollHeight ||
						durationExceeded ||
						iterationsExceeded
					) {
						clearInterval(timer);
						window.scrollTo(0, 0); // Scroll back to top
						resolve(undefined);
					}
				}, 100);
			});
		},
		{ fullPageScrollDuration, maxIterations },
	);
}

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
		return {
			pages: Math.ceil(pageHeight / window.innerHeight),
			extraHeight: (pageHeight % window.innerHeight) * window.devicePixelRatio,
			viewport: {
				height: window.innerHeight * window.devicePixelRatio,
				width: window.innerWidth * window.devicePixelRatio,
			},
		};
	});

	return result as ViewportInfo;
}
