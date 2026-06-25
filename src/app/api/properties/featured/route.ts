import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, zodErr } from "@/lib/api";
import { featuredQuerySchema } from "@/lib/validators/property-query";
import { toCardDto } from "@/lib/property-mappers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notDeleted } from "@/lib/property-status";
import { mockProperties } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = featuredQuerySchema.safeParse(params);
  if (!parsed.success) return zodErr(parsed.error);
  const { type, limit, area } = parsed.data;

  const where: Prisma.PropertyWhereInput = {
    ...notDeleted,
    status: "ACTIVE",
    // Use `contains` so a tab like "Nwaniba" matches stored area "Nwaniba Road"
    ...(area && { area: { contains: area, mode: "insensitive" } }),
  };
  let orderBy: Prisma.PropertyOrderByWithRelationInput;

  switch (type) {
    case "hot":
      orderBy = { views: "desc" };
      break;
    case "top":
      orderBy = { savedCount: "desc" };
      break;
    case "virgin":
      // Newest verified listings — proxy for "fresh, never-been-rented"
      where.verificationStatus = "VERIFIED";
      orderBy = { createdAt: "desc" };
      break;
    case "latest":
    default:
      orderBy = { createdAt: "desc" };
  }

  const [items, session] = await Promise.all([
    db.property.findMany({
      where,
      orderBy,
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

  if (items.length > 0) {
    return ok({
      type,
      items: items.map((p) => toCardDto(p, favIds.has(p.id))),
    });
  }

  return ok({ type, items: mockProperties.slice(0, limit) });
}
