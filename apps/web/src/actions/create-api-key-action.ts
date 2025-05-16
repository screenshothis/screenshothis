import { keyLimits } from "@screenshothis/common/keys";
import { CreateApiKeySchema } from "@screenshothis/schemas/api-keys";
import { createServerFn } from "@tanstack/react-start";

import { authClient } from "#/lib/auth.ts";
import { authMiddleware } from "#/middleware.ts";

export const createApiKeyAction = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(CreateApiKeySchema)
	.handler(async ({ data: { plan, ...values }, context }) => {
		if (!keyLimits[plan]) {
			const validPlans = Object.keys(keyLimits).join(", ");
			return {
				data: null,
				error: {
					message: `Invalid plan: ${plan}. Valid plans are: ${validPlans}`,
				},
			};
		}
		// Ensure type safety for rate limit parameters
		type PlanLimits = (typeof keyLimits)[keyof typeof keyLimits];
		const limits: PlanLimits = keyLimits[plan];

		const { data, error } = await authClient.apiKey.create({
			...values,
			rateLimitTimeWindow: limits.rateLimitTimeWindow,
			rateLimitMax: limits.rateLimitMax,
			rateLimitEnabled: limits.rateLimitEnabled,
			userId: context.user.id,
			metadata: {
				workspaceId: context.session.activeOrganizationId,
			},
		});

		if (error) {
			return {
				data: null,
				error,
			};
		}

		return {
			data,
			error: null,
		};
	});
