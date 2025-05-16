import { Polar } from "@polar-sh/sdk";

import { env } from "#/utils/env.ts";

export const polar = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN,
});
