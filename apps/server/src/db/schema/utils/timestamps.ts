import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
	createdAt: timestamp("created_at").default(
		sql`(now() AT TIME ZONE 'utc'::text)`,
	),
	updatedAt: timestamp("updated_at")
		.default(sql`(now() AT TIME ZONE 'utc'::text)`)
		.$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`),
};
