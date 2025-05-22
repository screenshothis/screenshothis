ALTER TABLE "screenshots" ALTER COLUMN "cache_ttl" SET DEFAULT 3600;--> statement-breakpoint
ALTER TABLE "screenshots" ALTER COLUMN "cache_key" DROP NOT NULL;