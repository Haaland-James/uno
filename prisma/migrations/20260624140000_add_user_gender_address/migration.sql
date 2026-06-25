-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

-- AlterTable (only touches User — no Property ALTER avoids the geom column issue)
ALTER TABLE "User" ADD COLUMN "gender" "Gender";
ALTER TABLE "User" ADD COLUMN "address" TEXT;
