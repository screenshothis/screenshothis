import { generateId } from "@screenshothis/id";
import type { PlanType } from "@screenshothis/schemas/plan";
import { relations } from "drizzle-orm";
import {
	bigint,
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { timestamps } from "./utils/timestamps";

export const requestLimits = pgTable("request_limits", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => generateId("requestLimit")),
	totalRequests: integer("total_requests"),
	totalAllowedRequests: integer("total_allowed_requests"),
	remainingRequests: integer("remaining_requests"),
	plan: text("plan").$type<PlanType>().notNull(),
	refillAmount: integer("refill_amount"),
	refillInterval: bigint({
		mode: "bigint",
	}),
	refilledAt: timestamp("refilled_at"),
	isExtraEnabled: boolean("is_extra_enabled").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, {
			onDelete: "cascade",
		}),
	...timestamps,
});

export const requestLimitsRelations = relations(requestLimits, ({ one }) => ({
	user: one(users, {
		fields: [requestLimits.userId],
		references: [users.id],
	}),
}));
