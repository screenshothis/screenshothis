CREATE INDEX "screenshots_created_at_idx" ON "screenshots" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "screenshots_url_idx" ON "screenshots" USING btree ("url");