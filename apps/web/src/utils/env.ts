import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		POLAR_ACCESS_TOKEN: z.string({
			required_error: "Polar access token is required",
		}),
		POLAR_ENVIRONMENT: z
			.enum(["development", "production"])
			.default("development"),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: "VITE_",

	client: {
		VITE_SERVER_URL: z.string().url(),
		VITE_GOOGLE_CLIENT_ID: z.string(),
	},

	/**
	 * What object holds the environment variables at runtime. This is usually
	 * `process.env` or `import.meta.env`.
	 */
	runtimeEnv: {
		POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
		POLAR_ENVIRONMENT: process.env.POLAR_ENVIRONMENT,
		VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
		VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
	},

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,
});
