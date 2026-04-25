import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { toCardDto } from "@/lib/property-mappers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/favourites
 * Returns the current user's favourited properties (full card DTOs, newest first).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("unauthenticated", "Sign in to see your favourites", 401);

  const favs = await db.favourite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        include: { photos: { orderBy: { order: "asc" } } },
      },
    },
  });

  // Hide non-ACTIVE properties — landlord may have paused/rented since user favourited
  const items = favs
    .filter((f) => f.property.status === "ACTIVE")
    .map((f) => toCardDto(f.property, true));

  return ok({ items, total: items.length });
}
