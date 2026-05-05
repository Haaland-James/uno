import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { toDetailDto } from "@/lib/property-mappers";
import { propertyUpdateSchema } from "@/lib/validators/property";
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

/**
 * PATCH /api/properties/[id] — partial update by the owning lister or admin.
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return err("unauthorized", "Sign in to update this listing", 401);
  }

  const property = await db.property.findUnique({
    where: { id },
    select: { id: true, landlordId: true },
  });
  if (!property) return err("not_found", "Property not found", 404);

  const isOwner = property.landlordId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return err("forbidden", "You don't have permission to edit this listing", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("bad_request", "Invalid JSON body", 400);
  }
  const parsed = propertyUpdateSchema.safeParse(body);
  if (!parsed.success) return zodErr(parsed.error);
  const data = parsed.data;

  const updated = await db.property.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.propertyType !== undefined && { propertyType: data.propertyType }),
      ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms }),
      ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms }),
      ...(data.size !== undefined && { size: data.size }),
      ...(data.yearBuilt !== undefined && { yearBuilt: data.yearBuilt }),
      ...(data.furnishing !== undefined && { furnishing: data.furnishing }),
      ...(data.condition !== undefined && { condition: data.condition }),
      ...(data.floorNumber !== undefined && { floorNumber: data.floorNumber }),
      ...(data.amenities !== undefined && { amenities: data.amenities }),
      ...(data.customAmenities !== undefined && { customAmenities: data.customAmenities }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.area !== undefined && { area: data.area }),
      ...(data.streetAddress !== undefined && { streetAddress: data.streetAddress }),
      ...(data.landmark !== undefined && { landmark: data.landmark }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.fullAddressVisible !== undefined && { fullAddressVisible: data.fullAddressVisible }),
      ...(data.rent !== undefined && { rent: data.rent }),
      ...(data.rentPeriod !== undefined && { rentPeriod: data.rentPeriod }),
      ...(data.agencyFee !== undefined && { agencyFee: data.agencyFee }),
      ...(data.cautionDeposit !== undefined && { cautionDeposit: data.cautionDeposit }),
      ...(data.serviceCharge !== undefined && { serviceCharge: data.serviceCharge }),
      ...(data.negotiable !== undefined && { negotiable: data.negotiable }),
      ...(data.availabilityStatus !== undefined && { availabilityStatus: data.availabilityStatus }),
      ...(data.availableFrom !== undefined && {
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
      }),
      ...(data.minimumLease !== undefined && { minimumLease: data.minimumLease }),
    },
    select: { id: true, status: true },
  });

  return ok(updated);
}

/**
 * DELETE /api/properties/[id] — owner or admin only.
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return err("unauthorized", "Sign in to delete this listing", 401);
  }

  const property = await db.property.findUnique({
    where: { id },
    select: { landlordId: true },
  });
  if (!property) return err("not_found", "Property not found", 404);

  const isOwner = property.landlordId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return err("forbidden", "You don't have permission to delete this listing", 403);
  }

  await db.property.delete({ where: { id } });
  return ok({ ok: true });
}
