import type { PlanType } from "@screenshothis/schemas/plan";

type Plan = {
	name: string;
	price?: number;
	isFeatured?: boolean;
	isCustom?: boolean;
	features: string[];
	extraScreenshotsCost?: number;
};

export const plans: Record<Exclude<PlanType, "free">, Plan> = {
	lite: {
		name: "Lite",
		price: 5,
		features: [
			"<strong>1,000 Screenshots</strong> are included",
			"<strong>300 requests</strong> each minute",
			"Blocks ads and cookie banners",
			"Takes full-page screenshots",
			"Includes caching <span class='text-(--text-sub-600)'>(you only pay for each screenshot made)</span>",
		],
		extraScreenshotsCost: 0.005,
	},
	pro: {
		name: "Pro",
		price: 15,
		isFeatured: true,
		features: [
			"<strong>10,000 Screenshots</strong> are included",
			"<strong>600 requests</strong> each minute",
			"Blocks ads and cookie banners",
			"Takes full-page screenshots",
			"Includes caching <span class='text-(--text-sub-600)'>(you only pay for each screenshot made)</span>",
		],
		extraScreenshotsCost: 0.001,
	},
	enterprise: {
		name: "Enterprise",
		isCustom: true,
		features: [
			"<strong>100,000 Screenshots</strong> are included",
			"<strong>6,000 requests</strong> each minute",
			"Blocks ads and cookie banners",
			"Takes full-page screenshots",
			"Includes caching <span class='text-(--text-sub-600)'>(you only pay for each screenshot made)</span>",
		],
		extraScreenshotsCost: 0.0005,
	},
};
