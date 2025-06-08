DROP INDEX CONCURRENTLY IF EXISTS "screenshots_workspace_id_idx";--> statement-breakpoint
CREATE INDEX "screenshots_workspace_cached_idx" ON "screenshots" USING btree ("workspace_id","is_cached");
