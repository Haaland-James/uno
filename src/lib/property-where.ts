import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { notDeleted } from "@/lib/property-status";
import type { PropertyListQuery } from "@/lib/validators/property-query";

/**
 * The one definition of "which listings does this search match?", shared by the
 * public search API (GET /api/properties) and the saved-search matcher, so a
 * saved search counts exactly what its page would show.
 *
 * Behaviour is a straight move out of the route: public results are ACTIVE and
 * not soft-deleted, and each filter only applies when it was supplied.
 */
export type PropertyWhereQuery = Partial<Omit<PropertyListQuery, "page" | "pageSize">>;

export function buildPropertyWhere(f: PropertyWhereQuery): Prisma.PropertyWhereInput {
  return {
    // Public list never shows non-ACTIVE or soft-deleted listings
    ...notDeleted,
    status: "ACTIVE",
    ...(f.ids?.length && { id: { in: f.ids } }),
    ...(f.listingType?.length && { listingType: { in: f.listingType } }),
    ...(f.city && { city: { equals: f.city, mode: "insensitive" } }),
    // Case-insensitive city-list filter via OR of equals clauses
    ...(!f.city && f.cities?.length && {
      OR: f.cities.map((c) => ({ city: { equals: c, mode: "insensitive" as const } })),
    }),
    ...(f.area && { area: { equals: f.area, mode: "insensitive" } }),
    ...(f.type?.length && { propertyType: { in: f.type } }),
    ...(f.beds?.length && { bedrooms: { in: f.beds } }),
    ...(f.baths?.length && { bathrooms: { in: f.baths } }),
    ...(f.furnishing?.length && { furnishing: { in: f.furnishing } }),
    ...((f.minPrice !== undefined || f.maxPrice !== undefined) && {
      rent: {
        ...(f.minPrice !== undefined && { gte: f.minPrice }),
        ...(f.maxPrice !== undefined && { lte: f.maxPrice }),
      },
    }),
    ...(f.amenities?.length && { amenities: { hasEvery: f.amenities } }),
    ...(f.minLng !== undefined &&
      f.maxLng !== undefined &&
      f.minLat !== undefined &&
      f.maxLat !== undefined && {
        latitude: { gte: f.minLat, lte: f.maxLat },
        longitude: { gte: f.minLng, lte: f.maxLng },
      }),
    ...(f.verifiedOnly && { verificationStatus: "VERIFIED" }),
    ...(f.availableNow && { availabilityStatus: "AVAILABLE_NOW" }),
  };
}

/**
 * Text-search candidates for `q`: GIN-indexed search_vector first (ranked), then
 * an ILIKE fallback on area/city for location-only queries. Moved verbatim from
 * the route so the matcher resolves free-text searches the same way.
 */
export async function findTextMatchIds(q: string): Promise<{ ids: string[]; ranked: boolean }> {
  const ftsRows = await db.$queryRaw<{ id: string; rank: number }[]>(
    Prisma.sql`
      SELECT id, ts_rank("search_vector", plainto_tsquery('english', ${q})) AS rank
      FROM "Property"
      WHERE "search_vector" @@ plainto_tsquery('english', ${q})
        AND status = 'ACTIVE'
        AND "deletedAt" IS NULL
      ORDER BY rank DESC, id ASC
      LIMIT 500
    `
  );

  if (ftsRows.length > 0) return { ids: ftsRows.map((r) => r.id), ranked: true };

  const likeTerm = `%${q}%`;
  const fallbackRows = await db.$queryRaw<{ id: string }[]>(
    Prisma.sql`
      SELECT id FROM "Property"
      WHERE (area ILIKE ${likeTerm} OR city ILIKE ${likeTerm})
        AND status = 'ACTIVE'
        AND "deletedAt" IS NULL
      ORDER BY id ASC
      LIMIT 500
    `
  );
  return { ids: fallbackRows.map((r) => r.id), ranked: false };
}
