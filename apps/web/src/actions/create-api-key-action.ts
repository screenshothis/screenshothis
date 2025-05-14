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
			return {
				data: null,
				error: { message: `Invalid plan: ${plan}` },
			};
		}

		const { data, error } = await authClient.apiKey.create({
			...values,
			rateLimitTimeWindow: keyLimits[plan].rateLimitTimeWindow,
			rateLimitMax: keyLimits[plan].rateLimitMax,
			rateLimitEnabled: keyLimits[plan].rateLimitEnabled,
			userId: context.user.id,
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
