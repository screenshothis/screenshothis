ALTER TABLE "screenshots" ADD COLUMN "is_mobile" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "screenshots" ADD COLUMN "is_landscape" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "screenshots" ADD COLUMN "has_touch" boolean DEFAULT false NOT NULL;