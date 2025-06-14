import { z } from "zod";

export const booleanSchema = z.preprocess((val) => {
	if (typeof val === "boolean") return val;
	if (typeof val === "string") {
		const lower = val.toLowerCase();
		if (lower === "true") return true;
		if (lower === "false") return false;
	}

	// Return original value so z.boolean() can handle validation and throw on invalid inputs
	return val;
}, z.boolean());
