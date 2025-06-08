DROP INDEX "screenshots_cached_idx";--> statement-breakpoint
CREATE INDEX "screenshots_cached_idx" ON "screenshots" USING btree ("is_cached");