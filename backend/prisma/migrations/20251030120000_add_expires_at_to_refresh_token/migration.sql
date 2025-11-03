-- Add expiresAt column to RefreshToken table with a sensible default
-- Ensures existing rows get a value and future inserts can set explicitly

ALTER TABLE "refresh_tokens"
ADD COLUMN "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + interval '30 days');


