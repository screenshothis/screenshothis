ALTER TABLE "screenshots" ADD COLUMN "block_requests" jsonb DEFAULT '[]'::jsonb;
