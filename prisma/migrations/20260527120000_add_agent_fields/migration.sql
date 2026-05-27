-- Idempotent migration. The previous failed `db push` partially applied
-- (enums got created before the geom error rolled the transaction back),
-- so every step here checks for existence first. Safe to re-run.

-- Agent enums
DO $$ BEGIN
  CREATE TYPE "AgentStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AgentEmployment" AS ENUM ('IN_HOUSE', 'EXTERNAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AgentBusinessType" AS ENUM ('INDIVIDUAL', 'AGENCY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- User: agent fields. Phase 2 fields are nullable so future migrations are additive.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "agentStatus" "AgentStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "agentEmployment" "AgentEmployment",
  ADD COLUMN IF NOT EXISTS "agentSlug" TEXT,
  ADD COLUMN IF NOT EXISTS "agentBio" TEXT,
  ADD COLUMN IF NOT EXISTS "agentPhoto" TEXT,
  ADD COLUMN IF NOT EXISTS "agentTerritory" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "agentVerifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "agentVerifiedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "agentBusinessType" "AgentBusinessType",
  ADD COLUMN IF NOT EXISTS "agentBusinessName" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT,
  ADD COLUMN IF NOT EXISTS "listingCredits" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "User_agentSlug_key" ON "User"("agentSlug");
CREATE INDEX IF NOT EXISTS "User_agentStatus_agentEmployment_idx"
  ON "User"("agentStatus", "agentEmployment");

-- Property: agent attribution + off-platform owner contact (in-house only)
ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "listedByAgent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "offPlatformOwnerName" TEXT,
  ADD COLUMN IF NOT EXISTS "offPlatformOwnerPhone" TEXT;

-- AgentReview: Phase 2 read-side scaffold. Table exists from day one so the
-- avg-rating widget on /agents/[slug] can ship without a later migration.
CREATE TABLE IF NOT EXISTS "AgentReview" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "propertyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AgentReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AgentReview_agentId_createdAt_idx"
  ON "AgentReview"("agentId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "AgentReview_agentId_authorId_propertyId_key"
  ON "AgentReview"("agentId", "authorId", "propertyId");

DO $$ BEGIN
  ALTER TABLE "AgentReview"
    ADD CONSTRAINT "AgentReview_agentId_fkey"
    FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AgentReview"
    ADD CONSTRAINT "AgentReview_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
