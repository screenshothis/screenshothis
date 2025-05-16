import { z } from "zod";

const envSchema = z.object({
	VITE_SERVER_URL: z.string().url(),
	POLAR_ACCESS_TOKEN: z.string(),
});

export const env = envSchema.parse(process.env);
