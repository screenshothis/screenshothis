import { generateId } from "@screenshothis/id";
import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { apikeys } from "./api-keys";
import { timestamps } from "./utils/timestamps";
import { workspace } from "./workspaces";

export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId("user")),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	imageUrl: text("image_url"),
	...timestamps,
});

export const sessions = pgTable("sessions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId("session")),
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
		.$defaultFn(() => generateId("account")),
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
		.$defaultFn(() => generateId("verification")),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	...timestamps,
});

export const userRelations = relations(users, ({ one }) => ({
	session: one(sessions, {
		fields: [users.id],
		references: [sessions.userId],
	}),
	apiKey: one(apikeys, {
		fields: [users.id],
		references: [apikeys.userId],
	}),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
	activeWorkspace: one(workspace, {
		fields: [sessions.activeWorkspaceId],
		references: [workspace.id],
	}),
}));
