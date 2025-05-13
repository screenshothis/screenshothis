import { z } from "zod";
import { EmailSchema } from "./common.ts";

export const SignInSchema = z.object({
	email: EmailSchema,
	password: z.string({ required_error: "Password is required" }).min(8, {
		message: "Password must be at least 8 characters long",
	}),
	rememberMe: z.coerce.boolean(),
});

export const SignUpSchema = z.object({
	name: z
		.string({
			required_error: "Full name is required",
		})
		.min(1, {
			message: "Full name is required",
		}),
	email: EmailSchema,
	password: z
		.string({ required_error: "Password is required" })
		.min(8, {
			message: "Password must be at least 8 characters long",
		})
		.refine((password) => /[A-Z]/.test(password), {
			message: "Password must contain at least one uppercase letter",
		})
		.refine((password) => /[a-z]/.test(password), {
			message: "Password must contain at least one lowercase letter",
		})
		.refine((password) => /[0-9]/.test(password), {
			message: "Password must contain at least one number",
		})
		.refine((password) => /[.!@#$%^&*]/.test(password), {
			message:
				"Password must contain at least one special character (.!@#$%^&*)",
		}),
});

export const ForgotPasswordSchema = z.object({
	email: EmailSchema,
});
