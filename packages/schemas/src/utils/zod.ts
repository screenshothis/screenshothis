import { z } from "zod";

export const booleanSchema = z.preprocess(
	(val) => String(val).toLowerCase() === "true",
	z.boolean(),
);
