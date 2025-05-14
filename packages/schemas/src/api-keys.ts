import { z } from "zod";

export const ApiKeysFilterSchema = z.object({
	q: z.string().optional(),
});
