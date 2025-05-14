/**
 * Defines the available subscription plan types.
 */
export type PlanType = "free" | "lite" | "pro" | "enterprise";

export type LimitMetadata = {
	totalRequests: number;
	totalAllowedRequests: number;
	remainingRequests: number;
	plan: PlanType;
	refillAmount: number;
	refillInterval: bigint;
	isExtraEnabled: boolean;
};

export type Limit = {
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
	metadata: LimitMetadata;
};

/**
 * Represents a 30-day period in milliseconds, used as the default refill interval.
 */
export const THIRTY_DAYS_MS = BigInt(30 * 24 * 60 * 60 * 1_000); // 30 days

/**
 * Defines the API key limits for different subscription plans.
 * IMPORTANT: This object serves as a template. Use the `createApiKeyLimits` function
 * to get a new, deep-cloned instance of the limits for a specific plan to avoid
 * accidental shared state mutation.
 *
 * These values are based on a combination of expected usage patterns for each tier,
 * competitive analysis of similar services, and a desire to provide clear, graduated steps
 * in service level as users upgrade their plans. The goal is to offer fair and scalable
 * access that aligns with typical needs at each subscription level.
 */
export const keyLimits: Record<PlanType, Limit> = {
	free: {
		rateLimitTimeWindow: 60 * 1000, // 1 minute
		rateLimitMax: 60, // 60 requests per minute
		rateLimitEnabled: true,
		metadata: {
			totalRequests: 0,
			totalAllowedRequests: 100,
			remainingRequests: 100,
			plan: "free",
			refillAmount: 100,
			refillInterval: THIRTY_DAYS_MS,
			isExtraEnabled: false,
		},
	},
	lite: {
		rateLimitTimeWindow: 60 * 1000, // 1 minute
		rateLimitMax: 300, // 300 requests per minute
		rateLimitEnabled: true,
		metadata: {
			totalRequests: 0,
			totalAllowedRequests: 1000,
			remainingRequests: 1000,
			plan: "lite",
			refillAmount: 1000,
			refillInterval: THIRTY_DAYS_MS,
			isExtraEnabled: true,
		},
	},
	pro: {
		rateLimitTimeWindow: 60 * 1000, // 1 minute
		rateLimitMax: 600, // 600 requests per minute
		rateLimitEnabled: true,
		metadata: {
			totalRequests: 0,
			totalAllowedRequests: 10000,
			remainingRequests: 10000,
			plan: "pro",
			refillAmount: 10000,
			refillInterval: THIRTY_DAYS_MS,
			isExtraEnabled: true,
		},
	},
	enterprise: {
		rateLimitTimeWindow: 60 * 1000, // 1 minute
		rateLimitMax: 6000, // 6000 requests per minute
		rateLimitEnabled: true,
		metadata: {
			totalRequests: 0,
			totalAllowedRequests: 100000,
			remainingRequests: 100000,
			plan: "enterprise",
			refillAmount: 100000,
			refillInterval: THIRTY_DAYS_MS,
			isExtraEnabled: true,
		},
	},
};

/**
 * Creates a new, deep-cloned Limit object for the specified plan.
 * This prevents accidental mutation of the shared template in `keyLimits`.
 * @param plan The plan type for which to create the limits.
 * @returns A deep clone of the Limit object for the specified plan.
 */
export function createApiKeyLimits(plan: PlanType): Limit {
	const limits = keyLimits[plan];
	if (!limits) {
		throw new Error(`Invalid plan type: ${plan}`);
	}
	return structuredClone(limits);
}
