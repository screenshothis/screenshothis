import { Polar } from "@polar-sh/sdk";

import { env } from "#/utils/env.server.ts";

export const polar = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN,
});
