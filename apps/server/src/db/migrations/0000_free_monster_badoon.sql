CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"image_url" text NOT NULL,
	"email" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint,
	CONSTRAINT "users_external_id_unique" UNIQUE("external_id")
);
