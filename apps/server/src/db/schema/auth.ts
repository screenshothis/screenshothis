import { bigint, pgTable, text } from "drizzle-orm/pg-core";

import { newId } from "#/utils/generate-id";

export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => newId("user")),
	externalId: text("external_id").unique().notNull(),
	username: text("username"),
	firstName: text("first_name"),
	lastName: text("last_name"),
	imageUrl: text("image_url").notNull(),
	email: text("email"),
	createdAt: bigint("created_at", { mode: "number" })
		.notNull()
		.$defaultFn(() => Date.now()),
	updatedAt: bigint("updated_at", { mode: "number" }).$onUpdateFn(() =>
		Date.now(),
	),
});
