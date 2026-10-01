import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { toCardDto } from "@/lib/property-mappers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findSimilarProperties } from "@/lib/similar-properties";

export async function GET(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;
  const asked = Number(req.nextUrl.searchParams.get("limit") ?? 6);
  const limit = Number.isFinite(asked) && asked >= 1 ? Math.min(Math.floor(asked), 12) : 6;

  const seed = await db.property.findUnique({
    where: { id },
    select: { area: true, city: true, propertyType: true, rent: true, listingType: true },
  });
  if (!seed) return err("not_found", "Property not found", 404);

  const [items, session] = await Promise.all([
    findSimilarProperties(seed, id, limit),
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
