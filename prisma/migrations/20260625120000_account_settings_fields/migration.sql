-- Password hash for email+password login (nullable — OTP-only users won't have one)
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- Soft-delete timestamp for account deactivation
ALTER TABLE "User" ADD COLUMN "deactivatedAt" TIMESTAMP(3);

-- Notification preferences
ALTER TABLE "User" ADD COLUMN "notifyNewProperties" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "notifyPriceDrops"    BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "notifyWeeklyDigest"  BOOLEAN NOT NULL DEFAULT false;

-- Language preference (BCP-47 tag, no actual i18n yet)
ALTER TABLE "User" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';

-- NextAuth Account table for OAuth providers (Google)
CREATE TABLE "Account" (
  "id"                TEXT NOT NULL,
  "userId"            TEXT NOT NULL,
  "type"              TEXT NOT NULL,
  "provider"          TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token"     TEXT,
  "access_token"      TEXT,
  "expires_at"        INTEGER,
  "token_type"        TEXT,
  "scope"             TEXT,
  "id_token"          TEXT,
  "session_state"     TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
