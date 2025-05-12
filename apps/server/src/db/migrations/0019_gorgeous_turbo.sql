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
	"created_at" integer DEFAULT extract(epoch from now()) * 1000 NOT NULL,
	"updated_at" integer
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"expires_at" timestamp NOT NULL,
	"user_id" text NOT NULL,
	"created_at" integer DEFAULT extract(epoch from now()) * 1000 NOT NULL,
	"updated_at" integer,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" integer DEFAULT extract(epoch from now()) * 1000 NOT NULL,
	"updated_at" integer
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_external_id_unique";--> statement-breakpoint
ALTER TABLE "access_tokens" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now()) * 1000;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "image_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now()) * 1000;--> statement-breakpoint
ALTER TABLE "polar_customer_state" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now()) * 1000;--> statement-breakpoint
ALTER TABLE "screenshots" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now()) * 1000;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now()) * 1000;--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now()) * 1000;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "created_at" SET DEFAULT extract(epoch from now()) * 1000;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "external_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "first_name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "last_name";