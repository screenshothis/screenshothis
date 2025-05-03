import { bigint } from "drizzle-orm/pg-core";

export const timestamps = {
	createdAt: bigint("created_at", { mode: "number" })
		.notNull()
		.default(0)
		.$defaultFn(() => Date.now()),
	updatedAt: bigint("updated_at", { mode: "number" }).$onUpdateFn(() =>
		Date.now(),
	),
};
