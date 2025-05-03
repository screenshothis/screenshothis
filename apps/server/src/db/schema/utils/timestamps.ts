import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/sqlite-core";

export const timestamps = {
	createdAt: integer({ mode: "number" }).notNull().default(sql`(unixepoch())`),
	updatedAt: integer({ mode: "number" }).$onUpdateFn(() => sql`(unixepoch())`),
};
