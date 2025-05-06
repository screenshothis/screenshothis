CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"image_url" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT (now()) NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "users_externalId_unique" UNIQUE("external_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
