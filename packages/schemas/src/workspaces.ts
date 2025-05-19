import { z } from "zod";

export const WorkspaceMetadataSchema = z.object({
	allowedOrigins: z
		.string()
		.transform((value) =>
			value
				.split("\n")
				.map((origin) => origin.trim())
				.filter((origin) => origin !== ""),
		)
		.refine(
			(origins) =>
				Array.isArray(origins) &&
				origins.every((value) => {
					const domainPattern =
						/^(\*\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)$/;
					return domainPattern.test(value);
				}),
			{
				message:
					"Each line must be a valid domain or wildcard pattern (e.g., example.com or *.example.com)",
			},
		),
});

export const WorkspaceSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	metadata: WorkspaceMetadataSchema.partial().optional(),
});

export const UpdateWorkspaceSchema = WorkspaceSchema;
