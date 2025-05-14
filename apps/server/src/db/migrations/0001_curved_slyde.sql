CREATE TABLE "request_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"total_requests" integer,
	"total_allowed_requests" integer,
	"remaining_requests" integer,
	"plan" text NOT NULL,
	"refill_amount" integer,
	"refill_interval" bigint,
	"is_extra_enabled" boolean NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "request_limits" ADD CONSTRAINT "request_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;