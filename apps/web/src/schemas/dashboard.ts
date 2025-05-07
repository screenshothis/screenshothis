import { fallback } from "@tanstack/zod-adapter";
import * as z from "zod";

export const RangeSchema = z.enum(["24h", "7d", "30d", "year"]);

export const DashboardSearchSchema = z.object({
	range: fallback(RangeSchema, "30d").default("30d"),
});
