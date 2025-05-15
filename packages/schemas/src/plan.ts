import { z } from "zod";

export const PlanTypeSchema = z.enum(["free", "lite", "pro", "enterprise"]);
export type PlanType = z.infer<typeof PlanTypeSchema>;
