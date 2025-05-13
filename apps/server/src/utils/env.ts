import { z } from "zod";

const envSchema = z.object({
	CORS_ORIGIN: z.string().url().optional(),
	DATABASE_URL: z.string(),
	AWS_ACCESS_KEY_ID: z.string(),
	AWS_SECRET_ACCESS_KEY: z.string(),
	AWS_REGION: z.string().optional(),
	AWS_BUCKET: z.string(),
	AWS_URL: z.string().optional(),
	AWS_ENDPOINT: z.string().optional(),
	AWS_USE_PATH_STYLE_ENDPOINT: z.coerce.boolean().optional(),
	POLAR_ACCESS_TOKEN: z.string(),
	POLAR_SUCCESS_URL: z.string(),
	POLAR_SERVER: z.enum(["sandbox", "production"]),
	POLAR_WEBHOOK_SECRET: z.string(),
	POLAR_LITE_PRODUCT_ID: z.string(),
	POLAR_PRO_PRODUCT_ID: z.string(),
	BETTER_AUTH_SECRET: z.string(),
	DEFAULT_API_KEY_PREFIX: z.string(),
});

export const env = envSchema.parse(process.env);
