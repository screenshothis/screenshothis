ALTER TABLE "screenshots" ADD COLUMN "duration" real DEFAULT 0 NOT NULL;
ALTER TABLE "screenshots" ADD CONSTRAINT screenshots_duration_nonnegative CHECK (duration >= 0);
