import { pgTable, text } from "drizzle-orm/pg-core";

import { newId } from "#/utils/generate-id";
import { timestamps } from "./utils/timestamps.ts";

export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => newId("user")),
	externalId: text("external_id").unique().notNull(),
	username: text("username"),
	firstName: text("first_name"),
	lastName: text("last_name"),
	imageUrl: text("image_url").notNull(),
	email: text("email").unique().notNull(),
	...timestamps,
});
