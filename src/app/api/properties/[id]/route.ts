import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { toDetailDto } from "@/lib/property-mappers";
import { propertyUpdateSchema } from "@/lib/validators/property";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deriveStatusFields } from "@/lib/property-status";

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

  // Public surface — only show ACTIVE listings (or to the owner / admin).
  // Soft-deleted listings are hidden from everyone except admins.
  const isOwner = session?.user?.id === property.landlordId;
  const isAdmin = session?.user?.role === "ADMIN";
  if (property.deletedAt && !isAdmin) {
    return err("not_found", "Property not found", 404);
  }
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

  return ok(toDetailDto(property, isFavourited, { revealAddress: isOwner || isAdmin }));
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
    select: { id: true, landlordId: true, status: true, deletedAt: true },
  });
  if (!property || property.deletedAt) return err("not_found", "Property not found", 404);

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

  // If availableFrom changed, recompute the derived display fields against the
  // current lifecycle status — keeps `availabilityStatus` + `isRented` in sync.
  const nextAvailableFrom =
    data.availableFrom !== undefined
      ? data.availableFrom
        ? new Date(data.availableFrom)
        : null
      : undefined;
  const derived =
    nextAvailableFrom !== undefined
      ? deriveStatusFields(property.status, nextAvailableFrom)
      : null;

  const updated = await db.$transaction(async (tx) => {
    const propertyData = {
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

      ...(data.parkingSpaces !== undefined && { parkingSpaces: data.parkingSpaces }),
      ...(data.powerBackup !== undefined && { powerBackup: data.powerBackup }),
      ...(data.waterSource !== undefined && { waterSource: data.waterSource }),
      ...(data.internetReady !== undefined && { internetReady: data.internetReady }),

      ...(data.floorAreaSqm !== undefined && { floorAreaSqm: data.floorAreaSqm }),
      ...(data.floorLevel !== undefined && { floorLevel: data.floorLevel }),
      ...(data.units !== undefined && { units: data.units }),
      ...(data.fitOutState !== undefined && { fitOutState: data.fitOutState }),

      ...(data.plotSizeSqm !== undefined && { plotSizeSqm: data.plotSizeSqm }),
      ...(data.titleDocType !== undefined && { titleDocType: data.titleDocType }),
      ...(data.surveyAvailable !== undefined && { surveyAvailable: data.surveyAvailable }),
      ...(data.topography !== undefined && { topography: data.topography }),
      ...(data.accessRoad !== undefined && { accessRoad: data.accessRoad }),
      ...(data.fencing !== undefined && { fencing: data.fencing }),

      ...(data.city !== undefined && { city: data.city }),
      ...(data.area !== undefined && { area: data.area }),
      ...(data.lga !== undefined && { lga: data.lga }),
      ...(data.streetAddress !== undefined && { streetAddress: data.streetAddress }),
      ...(data.landmark !== undefined && { landmark: data.landmark }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.geocodeAccuracy !== undefined && { geocodeAccuracy: data.geocodeAccuracy }),
      ...(data.fullAddressVisible !== undefined && { fullAddressVisible: data.fullAddressVisible }),

      ...(data.rent !== undefined && { rent: data.rent }),
      ...(data.rentPeriod !== undefined && { rentPeriod: data.rentPeriod }),
      ...(data.agencyFee !== undefined && { agencyFee: data.agencyFee }),
      ...(data.agencyFeeMode !== undefined && { agencyFeeMode: data.agencyFeeMode }),
      ...(data.legalFee !== undefined && { legalFee: data.legalFee }),
      ...(data.legalFeeMode !== undefined && { legalFeeMode: data.legalFeeMode }),
      ...(data.cautionDeposit !== undefined && { cautionDeposit: data.cautionDeposit }),
      ...(data.serviceCharge !== undefined && { serviceCharge: data.serviceCharge }),
      ...(data.negotiable !== undefined && { negotiable: data.negotiable }),

      ...(data.availableFrom !== undefined && { availableFrom: nextAvailableFrom }),
      ...(derived ?? {}),
      ...(data.minimumLease !== undefined && { minimumLease: data.minimumLease }),
    };

    const result = await tx.property.update({
      where: { id },
      data: propertyData,
      select: { id: true, status: true },
    });

    // Photos: full replacement. Only touch when the client explicitly sent them.
    if (data.photos !== undefined) {
      await tx.propertyPhoto.deleteMany({ where: { propertyId: id } });
      const hasExplicitMain = data.photos.some((p) => p.isMain);
      await tx.propertyPhoto.createMany({
        data: data.photos.map((p, i) => ({
          propertyId: id,
          url: p.url,
          isMain: hasExplicitMain ? !!p.isMain : i === 0,
          order: i,
        })),
      });
    }

    return result;
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
    select: { landlordId: true, deletedAt: true },
  });
  if (!property || property.deletedAt) return err("not_found", "Property not found", 404);

  const isOwner = property.landlordId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return err("forbidden", "You don't have permission to delete this listing", 403);
  }

  // Soft delete — also flip status to PAUSED so any cached query that misses
  // the deletedAt filter still hides the listing.
  await db.property.update({
    where: { id },
    data: { deletedAt: new Date(), status: "PAUSED" },
  });
  return ok({ ok: true });
}
