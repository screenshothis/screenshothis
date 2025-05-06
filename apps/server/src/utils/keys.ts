type Limit = {
	remaining: number;
	refill: {
		interval: "daily" | "monthly";
		amount: number;
	};
	ratelimit: {
		limit: number;
		duration: number;
	};
};

export const keyLimits: Record<"free" | "pro" | "enterprise", Limit> = {
	free: {
		remaining: 100,
		refill: {
			interval: "monthly",
			amount: 100,
		},
		ratelimit: {
			limit: 60,
			duration: 60000,
		},
	},
	pro: {
		remaining: 10000,
		refill: {
			interval: "monthly",
			amount: 10000,
		},
		ratelimit: {
			limit: 600,
			duration: 60000,
		},
	},
	enterprise: {
		remaining: 100000,
		refill: {
			interval: "monthly",
			amount: 100000,
		},
		ratelimit: {
			limit: 6000,
			duration: 60000,
		},
	},
};
