import { z } from "zod";

export const WorkspaceMetadataSchema = z.object({
	allowedOrigins: z
		.array(
			z.string().refine(
				(value) => {
					// Matches domain patterns including wildcards (*.example.com)
					const domainPattern =
						/^(\*\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)$/;
					return domainPattern.test(value);
				},
				{
					message:
						"Must be a valid domain or wildcard pattern (e.g., example.com or *.example.com)",
				},
			),
		)
		.optional(),
});

export const WorkspaceSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	metadata: WorkspaceMetadataSchema.partial(),
});

export const UpdateWorkspaceSchema = WorkspaceSchema;
