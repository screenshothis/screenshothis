import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
	createdAt: timestamp().notNull().default(sql`(now())`),
	updatedAt: timestamp().$onUpdateFn(() => sql`(now())`),
};
