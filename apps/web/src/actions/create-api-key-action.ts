import type { CreateApiKeySchema } from "@screenshothis/schemas/api-keys";
import type { z } from "zod";

import { authClient } from "#/lib/auth.ts";

export async function createApiKeyAction(
	values: z.infer<typeof CreateApiKeySchema>,
) {
	return await authClient.apiKey.create(values);
}
