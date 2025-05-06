import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/pg-core";

export const timestamps = {
	createdAt: integer().notNull().default(sql`extract(epoch from now())`),
	updatedAt: integer().$onUpdateFn(() => sql`extract(epoch from now())`),
};
