import { z } from "zod";

export const WorkspaceMetadataSchema = z.object({
	allowedOrigins: z.array(z.string()).optional(),
});

export const WorkspaceSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	metadata: WorkspaceMetadataSchema.partial(),
});

export const UpdateWorkspaceSchema = WorkspaceSchema;
