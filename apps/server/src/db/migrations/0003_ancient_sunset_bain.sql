CREATE TABLE "access_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"external_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"last_used_at" integer DEFAULT extract(epoch from now()) NOT NULL,
	"created_at" integer DEFAULT extract(epoch from now()) NOT NULL,
	"updated_at" integer,
	CONSTRAINT "access_tokens_token_unique" UNIQUE("token"),
	CONSTRAINT "access_tokens_externalId_unique" UNIQUE("external_id")
);
