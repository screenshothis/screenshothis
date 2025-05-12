import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
	createdAt: timestamp({ withTimezone: true, mode: "string" }).default(
		sql`(now() AT TIME ZONE 'utc'::text)`,
	),
	updatedAt: timestamp({ withTimezone: true, mode: "string" })
		.default(sql`(now() AT TIME ZONE 'utc'::text)`)
		.$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`),
};
