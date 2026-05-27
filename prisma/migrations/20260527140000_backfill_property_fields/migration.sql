-- Backfill Property columns that exist in schema.prisma but were never
-- captured in earlier migrations. Idempotent: safe to re-run.

-- FeeMode enum (used by agencyFeeMode / legalFeeMode)
DO $$ BEGIN
  CREATE TYPE "FeeMode" AS ENUM ('FIXED', 'PERCENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Residential structured facts
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "parkingSpaces" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "powerBackup" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "waterSource" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "internetReady" BOOLEAN;

-- Commercial-specific
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "floorAreaSqm" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "floorLevel" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "units" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "fitOutState" TEXT;

-- Land-specific
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "plotSizeSqm" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "titleDocType" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "surveyAvailable" BOOLEAN;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "topography" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "accessRoad" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "fencing" BOOLEAN;

-- Geocoding metadata + LGA
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "lga" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "geocodeAccuracy" TEXT;

-- Fee mode columns
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "agencyFeeMode" "FeeMode" NOT NULL DEFAULT 'FIXED';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "legalFee" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "legalFeeMode" "FeeMode" NOT NULL DEFAULT 'FIXED';

-- Verification gate signals + soft-delete
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "verificationSignals" JSONB;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "verificationRequestedAt" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Index on deletedAt for soft-delete filtering
CREATE INDEX IF NOT EXISTS "Property_deletedAt_idx" ON "Property"("deletedAt");
