ALTER TABLE "screenshots" ALTER COLUMN "block_requests" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "screenshots" ALTER COLUMN "block_requests" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "screenshots" ADD COLUMN "block_resources" jsonb DEFAULT '[]'::jsonb;