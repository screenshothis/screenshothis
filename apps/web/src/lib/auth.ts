import { apiKeyClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { reactStartCookies } from "better-auth/react-start";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_SERVER_URL,
	basePath: "/auth",
	plugins: [organizationClient(), reactStartCookies(), apiKeyClient()],
});
