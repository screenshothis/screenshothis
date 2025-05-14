import { keyLimits } from "@screenshothis/common";
import { z } from "zod";

export const ApiKeysFilterSchema = z.object({
	q: z.string().optional(),
});

// Extract plan types from keyLimits
type Plan = keyof typeof keyLimits;

export const CreateApiKeySchema = z.object({
	name: z
		.string({ required_error: "Name is required" })
		.min(1, "Name is required"),
	plan: z.enum(Object.keys(keyLimits) as [Plan, ...Plan[]]),
});
