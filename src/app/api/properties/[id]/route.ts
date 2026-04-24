import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { toDetailDto } from "@/lib/property-mappers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;

  const [property, session] = await Promise.all([
    db.property.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { order: "asc" } },
        landlord: { include: { landlordProfile: true } },
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!property) return err("not_found", "Property not found", 404);

  // Public surface — only show ACTIVE listings (or to the owner / admin)
  const isOwner = session?.user?.id === property.landlordId;
  const isAdmin = session?.user?.role === "ADMIN";
  if (property.status !== "ACTIVE" && !isOwner && !isAdmin) {
    return err("not_found", "Property not found", 404);
  }

  // Mark favourited for the current user, if any
  let isFavourited = false;
  if (session?.user?.id) {
    const fav = await db.favourite.findUnique({
      where: {
        userId_propertyId: { userId: session.user.id, propertyId: id },
      },
    });
    isFavourited = !!fav;
  }

  // Fire-and-forget view increment (don't block the response).
  // De-duped per session via the View tracking endpoint (see below) — for now,
  // every GET counts. Stage 4 can refine if needed.
  db.property
    .update({ where: { id }, data: { views: { increment: 1 } } })
    .catch((e) => console.error("[property:view] increment failed", e));

  return ok(toDetailDto(property, isFavourited));
}
