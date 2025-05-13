type Limit = {
	/**
	 * The duration in milliseconds where each request is counted.
	 * Once the `rateLimitMax` is reached, the request will be rejected
	 * until the `timeWindow` has passed, at which point the time window will be reset.
	 */
	rateLimitTimeWindow: number;
	/**
	 * The maximum number of requests allowed within the `rateLimitTimeWindow`.
	 */
	rateLimitMax: number;
	/**
	 * Whether the rate limit is enabled for the API key.
	 */
	rateLimitEnabled: boolean;
	/**
	 * The metadata of the API key.
	 * This is used to store additional information about the API key.
	 */
	metadata: Record<string, string | number | boolean>;
};

export const keyLimits: Record<"free" | "lite" | "pro" | "enterprise", Limit> =
	{
		free: {
			rateLimitTimeWindow: 60 * 1000, // 1 minute
			rateLimitMax: 60, // 60 requests per minute
			rateLimitEnabled: true,
			metadata: {
				totalRequests: 100,
				remainingRequests: 100,
				plan: "free",
				refillAmount: 100,
				refillInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
				isExtraEnabled: false,
			},
		},
		lite: {
			rateLimitTimeWindow: 60 * 1000, // 1 minute
			rateLimitMax: 300, // 300 requests per minute
			rateLimitEnabled: true,
			metadata: {
				totalRequests: 1000,
				remainingRequests: 1000,
				plan: "lite",
				refillAmount: 1000,
				refillInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
				isExtraEnabled: true,
			},
		},
		pro: {
			rateLimitTimeWindow: 60 * 1000, // 1 minute
			rateLimitMax: 600, // 600 requests per minute
			rateLimitEnabled: true,
			metadata: {
				totalRequests: 10000,
				remainingRequests: 10000,
				plan: "pro",
				refillAmount: 10000,
				refillInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
				isExtraEnabled: true,
			},
		},
		enterprise: {
			rateLimitTimeWindow: 60 * 1000, // 1 minute
			rateLimitMax: 6000, // 6000 requests per minute
			rateLimitEnabled: true,
			metadata: {
				totalRequests: 100000,
				remainingRequests: 100000,
				plan: "enterprise",
				refillAmount: 100000,
				refillInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
				isExtraEnabled: true,
			},
		},
	};
