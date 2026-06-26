-- Property: composite for search hot path (status + city + type)
CREATE INDEX IF NOT EXISTS "Property_status_city_propertyType_idx"
  ON "Property"("status", "city", "propertyType");

-- Property: FK for My Listings / agent console
CREATE INDEX IF NOT EXISTS "Property_landlordId_idx"
  ON "Property"("landlordId");

-- Property: range filter / sort by price
CREATE INDEX IF NOT EXISTS "Property_rent_idx"
  ON "Property"("rent");

-- Property: admin review queue
CREATE INDEX IF NOT EXISTS "Property_verificationStatus_idx"
  ON "Property"("verificationStatus");

-- PropertyPhoto: FK loaded on every property card / detail
CREATE INDEX IF NOT EXISTS "PropertyPhoto_propertyId_idx"
  ON "PropertyPhoto"("propertyId");

-- Favourite: "X people saved this" counts
CREATE INDEX IF NOT EXISTS "Favourite_propertyId_idx"
  ON "Favourite"("propertyId");

-- SavedSearch: dashboard load
CREATE INDEX IF NOT EXISTS "SavedSearch_userId_idx"
  ON "SavedSearch"("userId");

-- ContactRequest: landlord inbox per listing
CREATE INDEX IF NOT EXISTS "ContactRequest_propertyId_idx"
  ON "ContactRequest"("propertyId");

-- ContactRequest: renter's "my inquiries"
CREATE INDEX IF NOT EXISTS "ContactRequest_tenantId_idx"
  ON "ContactRequest"("tenantId");
