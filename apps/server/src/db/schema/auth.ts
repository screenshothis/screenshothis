import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { newId } from "#/utils/generate-id";
import { timestamps } from "./utils/timestamps.ts";

export const users = sqliteTable("users", {
	id: text()
		.primaryKey()
		.$defaultFn(() => newId("user")),
	externalId: text().unique().notNull(),
	username: text(),
	firstName: text(),
	lastName: text(),
	imageUrl: text().notNull(),
	email: text().unique().notNull(),
	...timestamps,
});
