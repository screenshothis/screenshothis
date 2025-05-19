import { Polar } from "@polar-sh/sdk";

import { env } from "../utils/env";

export const polarClient = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN,
	server: env.POLAR_SERVER,
});
