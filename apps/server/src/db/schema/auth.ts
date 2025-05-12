import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { newId } from "#/utils/generate-id";
import { timestamps } from "./utils/timestamps";

export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => newId("user")),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	imageUrl: text("image_url"),
	...timestamps,
});

export const sessions = pgTable("sessions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => newId("session")),
	token: text("token").notNull().unique(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	expiresAt: timestamp("expires_at").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	activeWorkspaceId: text("active_workspace_id"),
	...timestamps,
});

export const accounts = pgTable("accounts", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => newId("account")),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	scope: text("scope"),
	password: text("password"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	...timestamps,
});

export const verifications = pgTable("verifications", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => newId("verification")),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	...timestamps,
});
