type Limit = {
	remaining: number;
	/**
	 * The amount to refill the `remaining` count of the API key.
	 */
	refillAmount: number;
	/**
	 * The interval to refill the API key in milliseconds.
	 */
	refillInterval: number;
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
};

export const keyLimits: Record<"free" | "lite" | "pro" | "enterprise", Limit> =
	{
		free: {
			remaining: 100,
			refillAmount: 100,
			refillInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
			rateLimitTimeWindow: 60 * 1000, // 1 minute
			rateLimitMax: 60, // 60 requests per minute
			rateLimitEnabled: true,
		},
		lite: {
			remaining: 1000,
			refillAmount: 1000,
			refillInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
			rateLimitTimeWindow: 60 * 1000, // 1 minute
			rateLimitMax: 300, // 300 requests per minute
			rateLimitEnabled: true,
		},
		pro: {
			remaining: 10000,
			refillAmount: 10000,
			refillInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
			rateLimitTimeWindow: 60 * 1000, // 1 minute
			rateLimitMax: 600, // 600 requests per minute
			rateLimitEnabled: true,
		},
		enterprise: {
			remaining: 100000,
			refillAmount: 100000,
			refillInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
			rateLimitTimeWindow: 60 * 1000, // 1 minute
			rateLimitMax: 6000, // 6000 requests per minute
			rateLimitEnabled: true,
		},
	};
