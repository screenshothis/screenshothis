import { z } from "zod";

export const ApiKeysFilterSchema = z.object({
	q: z.string().optional(),
});

export const CreateApiKeySchema = z.object({
	name: z
		.string({ required_error: "Name is required" })
		.min(1, "Name is required"),
});
