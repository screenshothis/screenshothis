import type { CustomerStateBenefitGrant } from "@polar-sh/sdk/models/components/customerstatebenefitgrant";
import type { CustomerStateMeter } from "@polar-sh/sdk/models/components/customerstatemeter";
import type { CustomerStateSubscription } from "@polar-sh/sdk/models/components/customerstatesubscription";
import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

import { newId } from "#/utils/generate-id";
import { relations } from "drizzle-orm";
import { timestamps } from "./utils/timestamps";
import { workspaces } from "./workspaces";

export const polarCustomerState = pgTable("polar_customer_state", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => newId("polarCustomerState")),
	metadata: jsonb("metadata")
		.$type<Record<string, string | number | boolean>>()
		.default({}),
	externalId: text("external_id").references(() => workspaces.id),
	email: text("email").notNull(),
	name: text("name"),
	activeSubscriptions: jsonb("active_subscriptions")
		.$type<CustomerStateSubscription[]>()
		.default([]),
	grantedBenefits: jsonb("granted_benefits")
		.$type<CustomerStateBenefitGrant[]>()
		.default([]),
	activeMeters: jsonb("active_meters")
		.$type<CustomerStateMeter[]>()
		.default([]),
	...timestamps,
});

export const polarCustomerStateRelations = relations(
	polarCustomerState,
	({ one }) => ({
		workspace: one(workspaces, {
			fields: [polarCustomerState.externalId],
			references: [workspaces.id],
		}),
	}),
);
