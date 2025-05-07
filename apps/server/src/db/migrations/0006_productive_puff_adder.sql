ALTER TABLE "access_tokens" DROP CONSTRAINT "access_tokens_externalId_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_externalId_unique";--> statement-breakpoint
ALTER TABLE "screenshots" ADD COLUMN "is_extra" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_external_id_unique" UNIQUE("external_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_external_id_unique" UNIQUE("external_id");