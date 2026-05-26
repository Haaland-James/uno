import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { propertyListQuerySchema } from "@/lib/validators/property-query";
import { privatize } from "@/lib/privacy";
import type { MapPin } from "@/types/property";

/**
 * Lightweight pins for the map. Returns up to 2000 `{id, lng, lat, rent, currency, addressPrivate}`
 * rows inside the requested bbox, hitting the PostGIS GiST index on `Property.geom`.
 * Coords are jittered server-side when the lister opted out of full-address visibility.
 *
 * Mirrors the public filters of /api/properties (city/area/beds/price/etc.) so the
 * map and the result list agree on which listings exist in the area.
 */

const MAX_PINS = 2000;

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = propertyListQuerySchema.safeParse(params);
  if (!parsed.success) return zodErr(parsed.error);
  const f = parsed.data;

  if (
    f.minLng === undefined ||
    f.minLat === undefined ||
    f.maxLng === undefined ||
    f.maxLat === undefined
  ) {
    return err("validation_error", "bbox (minLng/minLat/maxLng/maxLat) is required", 400);
  }

  const where: Prisma.Sql[] = [
    Prisma.sql`p.status = 'ACTIVE'`,
    Prisma.sql`p.geom && ST_MakeEnvelope(${f.minLng}, ${f.minLat}, ${f.maxLng}, ${f.maxLat}, 4326)`,
  ];

  if (f.ids?.length) where.push(Prisma.sql`p.id = ANY(${f.ids}::text[])`);
  if (f.listingType?.length)
    where.push(Prisma.sql`p."listingType"::text = ANY(${f.listingType}::text[])`);
  if (f.city) where.push(Prisma.sql`LOWER(p.city) = LOWER(${f.city})`);
  if (!f.city && f.cities?.length) {
    where.push(
      Prisma.sql`LOWER(p.city) = ANY(${f.cities.map((c) => c.toLowerCase())}::text[])`
    );
  }
  if (f.area) where.push(Prisma.sql`LOWER(p.area) = LOWER(${f.area})`);
  if (f.type?.length)
    where.push(Prisma.sql`p."propertyType"::text = ANY(${f.type}::text[])`);
  if (f.beds?.length) where.push(Prisma.sql`p.bedrooms = ANY(${f.beds}::int[])`);
  if (f.baths?.length) where.push(Prisma.sql`p.bathrooms = ANY(${f.baths}::int[])`);
  if (f.furnishing?.length)
    where.push(Prisma.sql`p.furnishing::text = ANY(${f.furnishing}::text[])`);
  if (f.minPrice !== undefined) where.push(Prisma.sql`p.rent >= ${f.minPrice}`);
  if (f.maxPrice !== undefined) where.push(Prisma.sql`p.rent <= ${f.maxPrice}`);
  if (f.amenities?.length)
    where.push(Prisma.sql`p.amenities @> ${f.amenities}::text[]`);
  if (f.verifiedOnly) where.push(Prisma.sql`p."verificationStatus" = 'VERIFIED'`);
  if (f.availableNow) where.push(Prisma.sql`p."availabilityStatus" = 'AVAILABLE_NOW'`);
  if (f.q) {
    const like = `%${f.q}%`;
    where.push(
      Prisma.sql`(p.title ILIKE ${like} OR p.description ILIKE ${like} OR p.area ILIKE ${like} OR p.city ILIKE ${like})`
    );
  }

  const whereSql = Prisma.join(where, " AND ");

  const rows = await db.$queryRaw<
    {
      id: string;
      rent: number;
      currency: string;
      fullAddressVisible: boolean;
      longitude: number | null;
      latitude: number | null;
    }[]
  >(Prisma.sql`
    SELECT p.id, p.rent, p.currency, p."fullAddressVisible",
           p.longitude, p.latitude
    FROM "Property" p
    WHERE ${whereSql}
    LIMIT ${MAX_PINS}
  `);

  const pins: MapPin[] = [];
  for (const r of rows) {
    if (r.longitude == null || r.latitude == null) continue;
    const priv = privatize(r.id, r.longitude, r.latitude, r.fullAddressVisible);
    if (priv.lng == null || priv.lat == null) continue;
    pins.push({
      id: r.id,
      lng: priv.lng,
      lat: priv.lat,
      rent: r.rent,
      currency: r.currency,
      addressPrivate: priv.addressPrivate,
    });
  }

  return ok({ pins, total: pins.length, capped: pins.length >= MAX_PINS });
}
