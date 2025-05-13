import { z } from "zod";

export const EmailSchema = z
	.string({
		required_error: "Email is required",
	})
	.email({
		message: "Invalid email address",
	});
