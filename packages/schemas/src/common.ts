import { z } from "zod";

export const EmailSchema = z
	.string({
		required_error: "Email is required",
	})
	.email({
		message: "Invalid email address",
	});

export const NewPasswordSchema = z
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
		message: "Password must contain at least one special character (.!@#$%^&*)",
	});
