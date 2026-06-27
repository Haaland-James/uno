-- Add state field to Property for location-based filtering

ALTER TABLE "Property" ADD COLUMN "state" TEXT;

CREATE INDEX "Property_state_idx" ON "Property"("state");
