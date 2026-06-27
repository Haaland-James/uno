-- Reports feature: user/guest-submitted reports against a listing.
-- Scoped strictly to NEW objects (enums + Report table). Does NOT touch the
-- Property table, so the `geom` generated column is never re-emitted.

-- Enums (idempotent — DO blocks so re-running after a partial failure is safe)
DO $$ BEGIN
  CREATE TYPE "ReportReason" AS ENUM ('SCAM', 'INACCURATE', 'UNAVAILABLE', 'DUPLICATE', 'OFFENSIVE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Report table
CREATE TABLE IF NOT EXISTS "Report" (
  "id"          TEXT NOT NULL,
  "propertyId"  TEXT NOT NULL,
  "reporterId"  TEXT,
  "reason"      "ReportReason" NOT NULL,
  "details"     TEXT,
  "status"      "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "resolution"  TEXT,
  "resolvedAt"  TIMESTAMP(3),
  "resolvedBy"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Report_propertyId_idx" ON "Report"("propertyId");

-- Foreign keys (guarded so re-runs don't error on existing constraints)
DO $$ BEGIN
  ALTER TABLE "Report"
    ADD CONSTRAINT "Report_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Report"
    ADD CONSTRAINT "Report_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
