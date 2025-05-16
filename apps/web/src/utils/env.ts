import { z } from "zod";

const envSchema = z.object({
	VITE_SERVER_URL: z.string().url(),
	POLAR_ACCESS_TOKEN: z.string(),
});

export const env = (() => {
	try {
		return envSchema.parse(process.env);
	} catch (error) {
		console.error("Environment validation failed:", error);

		throw new Error(
			"Missing or invalid environment variables. Check server logs for details.",
		);
	}
})();
