-- Performance indexes for search, favourites, and contact queries.
-- Hand-authored — never use `prisma db push` (see CLAUDE.md).

-- 1. Widen the Property search compound index.
--    The existing (status, city, propertyType) covers the first three
--    filter columns but forces bitmap heap scans for area/beds/rent.
--    This wider index lets Postgres satisfy the full filter chain in a
--    single index scan. Drop the old narrow one to avoid planner confusion.
DROP INDEX IF EXISTS "Property_status_city_propertyType_idx";

CREATE INDEX IF NOT EXISTS "Property_status_city_area_type_beds_rent_idx"
  ON "Property"("status", "city", "area", "propertyType", "bedrooms", "rent");

-- 2. Favourite(userId) — "show all my favourites" queries.
--    The existing unique(userId, propertyId) helps point lookups but
--    the planner can't use it efficiently for userId-only scans.
CREATE INDEX IF NOT EXISTS "Favourite_userId_idx"
  ON "Favourite"("userId");

-- 3. ContactRequest(propertyId, status) — admin/dashboard filtered queries.
--    Replaces the single-column propertyId index with a compound that
--    covers status-filtered counts (e.g. unread count per listing).
DROP INDEX IF EXISTS "ContactRequest_propertyId_idx";

CREATE INDEX IF NOT EXISTS "ContactRequest_propertyId_status_idx"
  ON "ContactRequest"("propertyId", "status");
