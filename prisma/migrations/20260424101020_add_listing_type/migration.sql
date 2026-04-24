-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('RENT', 'LEASE', 'SALE');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "listingType" "ListingType" NOT NULL DEFAULT 'RENT';
