import type { PlanType } from "@screenshothis/schemas/plan";

import type { ButtonProps } from "#/components/ui/button.tsx";

export type Plan = {
	name: string;
	price?: number;
	isFeatured?: boolean;
	isCustom?: boolean;
	features: string[];
	extraScreenshotsCost?: number;
	buttonStyle?: ButtonProps["$style"];
	buttonType?: ButtonProps["$type"];
	buttonLabel?: string;
};

export const plans: Record<Exclude<PlanType, "free">, Plan> = {
	lite: {
		name: "Lite",
		price: 9.99,
		features: [
			"<strong>2,000 Screenshots</strong> are included",
			"<strong>60 requests</strong> each minute",
			"Blocks ads and cookie banners",
			"Takes full-page screenshots",
			"Includes caching <sup class='text-sub text-primary'>1</sup>",
		],
		extraScreenshotsCost: 0.005,
		buttonStyle: "stroke",
		buttonType: "primary",
		buttonLabel: "Get Started",
	},
	pro: {
		name: "Pro",
		price: 19.99,
		isFeatured: true,
		features: [
			"<strong>10,000 Screenshots</strong> are included",
			"<strong>300 requests</strong> each minute",
			"Blocks ads and cookie banners",
			"Takes full-page screenshots",
			"Includes caching <sup class='text-sub text-white'>1</sup>",
		],
		extraScreenshotsCost: 0.001,
		buttonStyle: "filled",
		buttonType: "neutral",
		buttonLabel: "Get Started",
	},
	enterprise: {
		name: "Enterprise",
		price: 49.99,
		features: [
			"<strong>100,000 Screenshots</strong> are included",
			"<strong>3,000 requests</strong> each minute",
			"Blocks ads and cookie banners",
			"Takes full-page screenshots",
			"Includes caching <sup class='text-sub text-primary'>1</sup>",
		],
		extraScreenshotsCost: 0.0005,
		buttonStyle: "stroke",
		buttonType: "primary",
		buttonLabel: "Get Started",
	},
};
