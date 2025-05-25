ALTER TABLE "screenshots" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "screenshots" ADD COLUMN "headers" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "screenshots" ADD COLUMN "cookies" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "screenshots" ADD COLUMN "bypass_csp" boolean DEFAULT false NOT NULL;