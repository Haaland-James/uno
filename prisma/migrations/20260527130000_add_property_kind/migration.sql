-- Add PropertyKind enum and propertyKind column.
-- Idempotent: safe to re-run.

DO $$ BEGIN
  CREATE TYPE "PropertyKind" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'LAND');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "propertyKind" "PropertyKind" NOT NULL DEFAULT 'RESIDENTIAL';
