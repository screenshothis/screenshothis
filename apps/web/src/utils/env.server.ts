import { z } from "zod";

const envSchema = z.object({
	POLAR_ACCESS_TOKEN: z.string({
		required_error: "Polar access token is required",
	}),
	POLAR_ENVIRONMENT: z
		.enum(["development", "production"])
		.default("development"),
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
