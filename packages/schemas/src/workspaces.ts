import { z } from "zod";

export const WorkspaceSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
});

export const UpdateWorkspaceSchema = WorkspaceSchema;
