import { z } from "zod";

export const PlaygroundFormSchema = z.object({
	url: z
		.string({
			required_error: "URL is required",
		})
		.url({
			message: "Invalid URL",
		}),
});
