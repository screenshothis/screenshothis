import { Unkey } from "@unkey/api";

import { env } from "#/env";

export const unkey = new Unkey({
	token: env.UNKEY_ROOT_KEY,
});
