import { z } from "zod";
import { EmailSchema, NewPasswordSchema } from "./common.ts";

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
	password: NewPasswordSchema,
});

export const ForgotPasswordSchema = z.object({
	email: EmailSchema,
});

export const ResetPasswordSchema = z.object({
	newPassword: NewPasswordSchema,
	token: z.string({ required_error: "Token is required" }),
});
