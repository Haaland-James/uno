import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { toCardDto } from "@/lib/property-mappers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notDeleted } from "@/lib/property-status";

export async function GET(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") ?? 6),
    12
  );

  const seed = await db.property.findUnique({
    where: { id },
    select: { area: true, city: true, propertyType: true, rent: true },
  });
  if (!seed) return err("not_found", "Property not found", 404);

  // Score: same area > same city + type, within ±40% rent band
  const priceMin = Math.floor(seed.rent * 0.6);
  const priceMax = Math.ceil(seed.rent * 1.4);

  const [items, session] = await Promise.all([
    db.property.findMany({
      where: {
        ...notDeleted,
        id: { not: id },
        status: "ACTIVE",
        OR: [
          { area: seed.area, city: seed.city },
          { city: seed.city, propertyType: seed.propertyType, rent: { gte: priceMin, lte: priceMax } },
        ],
      },
      orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }],
      take: limit,
      include: { photos: { orderBy: { order: "asc" } } },
    }),
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

  return ok({ items: items.map((p) => toCardDto(p, favIds.has(p.id))) });
}
