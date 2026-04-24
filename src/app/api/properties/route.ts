import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, zodErr } from "@/lib/api";
import { propertyListQuerySchema } from "@/lib/validators/property-query";
import { toCardDto } from "@/lib/property-mappers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = propertyListQuerySchema.safeParse(params);
  if (!parsed.success) return zodErr(parsed.error);
  const f = parsed.data;

  const where: Prisma.PropertyWhereInput = {
    // Public list never shows non-ACTIVE listings
    status: "ACTIVE",
    ...(f.ids?.length && { id: { in: f.ids } }),
    ...(f.listingType?.length && { listingType: { in: f.listingType } }),
    ...(f.city && { city: { equals: f.city, mode: "insensitive" } }),
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
    ...(f.verifiedOnly && { verificationStatus: "VERIFIED" }),
    ...(f.availableNow && { availabilityStatus: "AVAILABLE_NOW" }),
    ...(f.q && {
      OR: [
        { title: { contains: f.q, mode: "insensitive" } },
        { description: { contains: f.q, mode: "insensitive" } },
        { area: { contains: f.q, mode: "insensitive" } },
        { city: { contains: f.q, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    f.sort === "price_asc"
      ? { rent: "asc" }
      : f.sort === "price_desc"
      ? { rent: "desc" }
      : f.sort === "most_viewed"
      ? { views: "desc" }
      : { createdAt: "desc" };

  const skip = (f.page - 1) * f.pageSize;

  const [items, total, session] = await Promise.all([
    db.property.findMany({
      where,
      orderBy,
      skip,
      take: f.pageSize,
      include: { photos: { orderBy: { order: "asc" } } },
    }),
    db.property.count({ where }),
    getServerSession(authOptions),
  ]);

  let favIds = new Set<string>();
  if (session?.user?.id && items.length) {
    const favs = await db.favourite.findMany({
      where: {
        userId: session.user.id,
        propertyId: { in: items.map((p) => p.id) },
      },
      select: { propertyId: true },
    });
    favIds = new Set(favs.map((f) => f.propertyId));
  }

  return ok({
    items: items.map((p) => toCardDto(p, favIds.has(p.id))),
    page: f.page,
    pageSize: f.pageSize,
    total,
    hasMore: skip + items.length < total,
  });
}
