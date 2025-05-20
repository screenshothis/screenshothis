import { polarClient } from "@polar-sh/better-auth";
import {
	apiKeyClient,
	oneTapClient,
	organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { env } from "#/utils/env.client.ts";

export const authClient = createAuthClient({
	baseURL: env.VITE_SERVER_URL,
	basePath: "/auth",
	plugins: [
		organizationClient(),
		apiKeyClient(),
		oneTapClient({
			clientId: env.VITE_GOOGLE_CLIENT_ID,
			cancelOnTapOutside: true,
			context: "signin",
		}),
		polarClient(),
	],
});
