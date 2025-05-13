import { relations } from "drizzle-orm";
import {
	bigint,
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { timestamps } from "./utils/timestamps";

export const apikeys = pgTable("api_keys", {
	id: text("id").primaryKey(),
	name: text("name"),
	start: text("start"),
	prefix: text("prefix"),
	key: text("key").notNull(),
	refillInterval: bigint("refill_interval", {
		mode: "bigint",
	}),
	refillAmount: bigint("refill_amount", {
		mode: "bigint",
	}),
	lastRefillAt: timestamp("last_refill_at"),
	enabled: boolean("enabled"),
	rateLimitEnabled: boolean("rate_limit_enabled"),
	rateLimitTimeWindow: bigint("rate_limit_time_window", {
		mode: "bigint",
	}),
	rateLimitMax: bigint("rate_limit_max", {
		mode: "bigint",
	}),
	requestCount: integer("request_count"),
	remaining: integer("remaining"),
	lastRequest: timestamp("last_request"),
	expiresAt: timestamp("expires_at"),
	permissions: text("permissions"),
	metadata: jsonb("metadata"),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	...timestamps,
});

export const apikeysRelations = relations(apikeys, ({ one }) => ({
	user: one(users, {
		fields: [apikeys.userId],
		references: [users.id],
	}),
}));
