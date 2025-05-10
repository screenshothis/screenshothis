ALTER TABLE "screenshots" ALTER COLUMN "block_requests" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "screenshots" ALTER COLUMN "block_resources" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "screenshots" ALTER COLUMN "prefers_color_scheme" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "screenshots" ALTER COLUMN "prefers_reduced_motion" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "screenshots" ADD COLUMN "device_scale_factor" real DEFAULT 1 NOT NULL;