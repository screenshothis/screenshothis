ALTER TABLE "screenshots" ADD COLUMN "block_ads" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "screenshots" ADD COLUMN "block_cookie_banners" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "screenshots" ADD COLUMN "block_trackers" boolean DEFAULT false NOT NULL;