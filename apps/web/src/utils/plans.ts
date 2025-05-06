type Plan = {
	name: string;
	price: number;
	isFeatured?: boolean;
	features: string[];
};

export const plans: Record<"free" | "pro" | "enterprise", Plan> = {
	free: {
		name: "Free",
		price: 0,
		features: [
			"100 Screenshots are included",
			"Handles 60 requests each minute",
			"Blocks ads and cookie banners",
			"Takes full-page screenshots",
			"Includes caching (you only pay for each screenshot made)",
		],
	},
	pro: {
		name: "Pro",
		price: 29,
		isFeatured: true,
		features: [
			"10,000 Screenshots are included",
			"Handles 600 requests each minute",
			"Blocks ads and cookie banners",
			"Takes full-page screenshots",
			"Includes caching (you only pay for each screenshot made)",
		],
	},
	enterprise: {
		name: "Enterprise",
		price: 149,
		features: [
			"100,000 Screenshots are included",
			"Handles 6,000 requests each minute",
			"Blocks ads and cookie banners",
			"Takes full-page screenshots",
			"Includes caching (you only pay for each screenshot made)",
		],
	},
};
