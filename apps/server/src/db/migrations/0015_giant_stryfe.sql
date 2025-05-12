CREATE TABLE "polar_customer_state" (
	"id" text PRIMARY KEY NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"external_id" text,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"active_subscriptions" jsonb DEFAULT '[]'::jsonb,
	"granted_benefits" jsonb DEFAULT '[]'::jsonb,
	"active_meters" jsonb DEFAULT '[]'::jsonb,
	"created_at" integer DEFAULT extract(epoch from now()) NOT NULL,
	"updated_at" integer
);
--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "polar_customer_id" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "polar_subscription_id" text;--> statement-breakpoint
ALTER TABLE "polar_customer_state" ADD CONSTRAINT "polar_customer_state_external_id_users_id_fk" FOREIGN KEY ("external_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;