import { z } from "zod";

const envSchema = z.object({
	CORS_ORIGIN: z.string().url().optional(),
	DATABASE_URL: z.string(),
	CLERK_PUBLISHABLE_KEY: z.string(),
	CLERK_SECRET_KEY: z.string(),
	CLERK_WEBHOOK_SIGNING_SECRET: z.string(),
	AWS_ACCESS_KEY_ID: z.string(),
	AWS_SECRET_ACCESS_KEY: z.string(),
	AWS_REGION: z.string().optional(),
	AWS_BUCKET: z.string(),
	AWS_URL: z.string().optional(),
	AWS_ENDPOINT: z.string().optional(),
	AWS_USE_PATH_STYLE_ENDPOINT: z.coerce.boolean().optional(),
	UNKEY_API_ID: z.string(),
	UNKEY_ROOT_KEY: z.string(),
	POLAR_ACCESS_TOKEN: z.string(),
	POLAR_SUCCESS_URL: z.string(),
	POLAR_SERVER: z.enum(["sandbox", "production"]),
	POLAR_WEBHOOK_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);
