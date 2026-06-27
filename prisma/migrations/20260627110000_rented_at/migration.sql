-- Add rentedAt timestamp to Property so we can show "Rented X days ago"

ALTER TABLE "Property" ADD COLUMN "rentedAt" TIMESTAMP(3);
