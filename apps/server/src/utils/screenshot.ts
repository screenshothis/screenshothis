import type { Page } from "puppeteer";

export async function scrollDown(page: Page) {
	await page.evaluate(async () => {
		await new Promise((resolve) => {
			let totalHeight = 0;
			const distance = 100;
			const timer = setInterval(() => {
				const scrollHeight = document.body.scrollHeight;
				window.scrollBy(0, distance);
				totalHeight += distance;

				if (totalHeight >= scrollHeight) {
					clearInterval(timer);
					window.scrollTo(0, 0); // Scroll back to top
					resolve(undefined);
				}
			}, 100);
		});
	});
}

export async function calculateViewport(page: Page) {
	return await page.evaluate(() => {
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
}
