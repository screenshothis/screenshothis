ALTER TABLE "screenshots" ADD COLUMN "is_cached" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "screenshots" ADD COLUMN "cache_ttl" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "screenshots" ADD COLUMN "cache_key" text DEFAULT '' NOT NULL;