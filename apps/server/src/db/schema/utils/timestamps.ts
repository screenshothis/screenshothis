import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/pg-core";

export const timestamps = {
	createdAt: integer("created_at")
		.notNull()
		.default(sql`extract(epoch from now())`),
	updatedAt: integer("updated_at").$onUpdateFn(
		() => sql`extract(epoch from now())`,
	),
};
