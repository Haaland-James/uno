import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/**
 * POST /api/favourites/[propertyId]
 * Idempotent: re-posting an existing favourite is a no-op success.
 * Atomically increments Property.savedCount on first add.
 */
export async function POST(
  _req: Request,
  ctx: { params: { propertyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("unauthenticated", "Sign in to favourite", 401);
  const { propertyId } = ctx.params;

  // Make sure the property exists and is visible
  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { id: true, status: true, deletedAt: true },
  });
  if (!property || property.deletedAt) return err("not_found", "Property not found", 404);
  if (property.status !== "ACTIVE") {
    return err("not_active", "Property is not currently available", 409);
  }

  try {
    await db.$transaction([
      db.favourite.create({
        data: { userId: session.user.id, propertyId },
      }),
      db.property.update({
        where: { id: propertyId },
        data: { savedCount: { increment: 1 } },
      }),
    ]);
    return ok({ favourited: true, propertyId });
  } catch (e) {
    // Unique constraint violation = already favourited (idempotent success)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return ok({ favourited: true, propertyId, alreadyFavourited: true });
    }
    throw e;
  }
}

/**
 * DELETE /api/favourites/[propertyId]
 * Idempotent: deleting a non-existent favourite is a no-op success.
 */
export async function DELETE(
  _req: Request,
  ctx: { params: { propertyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("unauthenticated", "Sign in to manage favourites", 401);
  const { propertyId } = ctx.params;

  const existing = await db.favourite.findUnique({
    where: {
      userId_propertyId: { userId: session.user.id, propertyId },
    },
  });

  if (!existing) return ok({ favourited: false, propertyId, wasNoOp: true });

  await db.$transaction([
    db.favourite.delete({ where: { id: existing.id } }),
    db.property.update({
      where: { id: propertyId },
      data: { savedCount: { decrement: 1 } },
    }),
  ]);

  return ok({ favourited: false, propertyId });
}
