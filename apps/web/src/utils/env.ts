import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		POLAR_ACCESS_TOKEN: z.string().optional(),
		POLAR_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
	},
	clientPrefix: "VITE_",
	client: {
		VITE_SERVER_URL: z.string().url(),
		VITE_GOOGLE_CLIENT_ID: z.string().optional(),
	},
	runtimeEnv: {
		POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
		POLAR_ENVIRONMENT: process.env.POLAR_ENVIRONMENT,
		VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
		VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
	},
	emptyStringAsUndefined: true,
});
