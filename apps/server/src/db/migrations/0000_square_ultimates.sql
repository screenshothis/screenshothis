CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"refill_interval" bigint,
	"refill_amount" bigint,
	"last_refill_at" timestamp,
	"enabled" boolean,
	"rate_limit_enabled" boolean,
	"rate_limit_time_window" bigint,
	"rate_limit_max" bigint,
	"request_count" integer,
	"remaining" integer,
	"last_request" timestamp,
	"expires_at" timestamp,
	"permissions" text,
	"metadata" jsonb,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	"updated_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text)
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"scope" text,
	"password" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	"updated_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"expires_at" timestamp NOT NULL,
	"user_id" text NOT NULL,
	"active_workspace_id" text,
	"created_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	"updated_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	"updated_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	"updated_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text)
);
--> statement-breakpoint
CREATE TABLE "polar_customer_state" (
	"id" text PRIMARY KEY NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"external_id" text,
	"email" text NOT NULL,
	"name" text,
	"active_subscriptions" jsonb DEFAULT '[]'::jsonb,
	"granted_benefits" jsonb DEFAULT '[]'::jsonb,
	"active_meters" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	"updated_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text)
);
--> statement-breakpoint
CREATE TABLE "screenshots" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"selector" text,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"is_mobile" boolean DEFAULT false NOT NULL,
	"is_landscape" boolean DEFAULT false NOT NULL,
	"device_scale_factor" real DEFAULT 1 NOT NULL,
	"has_touch" boolean DEFAULT false NOT NULL,
	"format" text NOT NULL,
	"block_ads" boolean DEFAULT false NOT NULL,
	"block_cookie_banners" boolean DEFAULT false NOT NULL,
	"block_trackers" boolean DEFAULT false NOT NULL,
	"block_requests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"block_resources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prefers_color_scheme" text DEFAULT 'light' NOT NULL,
	"prefers_reduced_motion" text DEFAULT 'no-preference' NOT NULL,
	"is_extra" boolean DEFAULT false NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	"updated_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text)
);
--> statement-breakpoint
CREATE TABLE "workspace_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	"updated_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text)
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	"updated_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text)
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	"updated_at" timestamp DEFAULT (now() AT TIME ZONE 'utc'::text),
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polar_customer_state" ADD CONSTRAINT "polar_customer_state_external_id_users_id_fk" FOREIGN KEY ("external_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;