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

export const UpdateUserSchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	image: z
		.union([
			z
				.instanceof(File)
				.refine(
					(file) =>
						["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(
							file.type,
						),
					{ message: "Invalid image file type" },
				)
				.refine((file) => file.size <= 5 * 1024 * 1024, {
					message: "Image file size must be less than 5MB",
				}),
			z.string().url(),
		])
		.nullable(),
});
