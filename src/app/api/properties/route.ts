import { NextRequest } from "next/server";
import { Prisma, type PropertyType, type PropertyKind, type ListingType, type Furnishing, type RentPeriod, type FeeMode } from "@prisma/client";
import { getKindForPropertyType } from "@/../config/constants";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { propertyListQuerySchema } from "@/lib/validators/property-query";
import {
  propertyWizardSubmitSchema,
  type PropertyWizardSubmitInput,
} from "@/lib/validators/property";
import { toCardDto } from "@/lib/property-mappers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeGateSignals } from "@/lib/gate";
import { listingCreateLimiter } from "@/lib/ratelimit";
import { deriveStatusFields, notDeleted } from "@/lib/property-status";
import { mockProperties } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = propertyListQuerySchema.safeParse(params);
  if (!parsed.success) return zodErr(parsed.error);
  const f = parsed.data;

  const where: Prisma.PropertyWhereInput = {
    // Public list never shows non-ACTIVE or soft-deleted listings
    ...notDeleted,
    status: "ACTIVE",
    ...(f.ids?.length && { id: { in: f.ids } }),
    ...(f.listingType?.length && { listingType: { in: f.listingType } }),
    ...(f.city && { city: { equals: f.city, mode: "insensitive" } }),
    // Case-insensitive city-list filter via OR of equals clauses
    ...(!f.city && f.cities?.length && {
      OR: f.cities.map((c) => ({ city: { equals: c, mode: "insensitive" as const } })),
    }),
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
    ...(f.minLng !== undefined &&
      f.maxLng !== undefined &&
      f.minLat !== undefined &&
      f.maxLat !== undefined && {
        latitude: { gte: f.minLat, lte: f.maxLat },
        longitude: { gte: f.minLng, lte: f.maxLng },
      }),
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

  if (items.length > 0) {
    return ok({
      items: items.map((p) => toCardDto(p, favIds.has(p.id))),
      page: f.page,
      pageSize: f.pageSize,
      total,
      hasMore: skip + items.length < total,
    });
  }

  const mockSlice = mockProperties.slice(skip, skip + f.pageSize);
  return ok({
    items: mockSlice,
    page: f.page,
    pageSize: f.pageSize,
    total: mockProperties.length,
    hasMore: skip + mockSlice.length < mockProperties.length,
  });
}

/**
 * POST /api/properties — create a property from the listing wizard.
 * Auth required. Sets status=PENDING (awaiting verification) and submittedAt=now.
 * If the user has no LandlordProfile yet, creates a minimal one (first-time lister).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return err("unauthorized", "Sign in to publish a listing", 401);
  }

  // Listings go live immediately (approval flow on hold), so this cap is the
  // only ceiling on spam listings per account.
  const rl = await listingCreateLimiter.limit(session.user.id);
  if (!rl.success) {
    return err("rate_limited", "You've published a lot of listings recently — try again later.", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("bad_request", "Invalid JSON body", 400);
  }

  const parsed = propertyWizardSubmitSchema.safeParse(body);
  if (!parsed.success) return zodErr(parsed.error);
  const w = parsed.data;

  try {
    // Ensure the user has a LandlordProfile — first-time listers won't have one yet.
    await db.landlordProfile.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
    });

    // Detect in-house agents. They get the off-platform-owner fields persisted
    // and the listedByAgent flag flipped — which is the single source of truth
    // the public UI reads to display "Listed by UNO" instead of the lister's
    // name. Regular landlords ignore both fields entirely (defence-in-depth: a
    // malicious payload from a non-agent can't smuggle owner data in).
    const submitter = await db.user.findUnique({
      where: { id: session.user.id },
      select: { agentStatus: true, agentEmployment: true },
    });
    const isInHouseAgent =
      submitter?.agentStatus === "VERIFIED" &&
      submitter?.agentEmployment === "IN_HOUSE";

    if (isInHouseAgent) {
      if (!w.offPlatformOwnerName.trim() || !w.offPlatformOwnerPhone.trim()) {
        return err(
          "validation_error",
          "Off-platform owner name and phone are required for agent listings",
          400
        );
      }
    }

    // Map wizard payload → Prisma Property fields.
    const propertyType = mapPropertyType(w.propertyType);
    if (!propertyType) {
      return err("validation_error", `Unsupported property type: ${w.propertyType}`, 400);
    }

    const listingType: ListingType = w.objective === "SELL" ? "SALE" : w.objective;
    const furnishing = mapFurnishing(w.furnishing);
    const rent = listingType === "SALE" ? w.salePrice ?? 0 : w.rent ?? 0;
    if (rent <= 0) {
      return err("validation_error", "Price/rent is required", 400);
    }

    const availableFromDate =
      w.availability === "AVAILABLE_FROM" && w.availableFrom
        ? new Date(w.availableFrom)
        : null;

    const description = [w.briefDescription, w.leaseTerms].filter(Boolean).join("\n\n");

    // Resolve PropertyKind: prefer explicit value from wizard, else infer from type.
    const propertyKind: PropertyKind =
      (w.propertyKind as PropertyKind | undefined) ??
      ((getKindForPropertyType(w.propertyType) ?? "RESIDENTIAL") as PropertyKind);

    const agencyFeeAmount = w.agencyFee?.value ?? null;
    const agencyFeeMode: FeeMode = (w.agencyFee?.mode ?? "FIXED") as FeeMode;
    const legalFeeAmount = w.legalFee?.value ?? null;
    const legalFeeMode: FeeMode = (w.legalFee?.mode ?? "FIXED") as FeeMode;

    // Approval flow is on hold — submitted listings go live immediately.
    // Gate-1 signals are still computed and stored so we have evidence ready
    // for when the admin/verification flow is designed. Re-enable by gating
    // `initialStatus` on `gate.autoPublish` (see git history of this file).
    const gate = await computeGateSignals({
      listerUserId: session.user.id,
      title: w.title,
      description: description || null,
      photoCount: w.photos.length,
      latitude: w.latitude ?? null,
      longitude: w.longitude ?? null,
      bedrooms: w.bedrooms ?? 0,
      rent: Math.round(rent),
    });
    const now = new Date();
    const initialStatus = "ACTIVE";
    const derived = deriveStatusFields(initialStatus, availableFromDate);

    const created = await db.property.create({
      data: {
        landlordId: session.user.id,
        title: w.title,
        propertyKind,
        propertyType,
        listingType,
        bedrooms: w.bedrooms ?? 0,
        bathrooms: w.bathrooms ?? 0,
        description: description || null,
        size: w.size ?? null,
        yearBuilt: w.yearBuilt ?? null,
        furnishing,
        condition: w.condition || null,
        floorNumber: w.floorNumber || null,
        amenities: w.amenities,
        customAmenities: w.customAmenities,
        parkingSpaces: w.parkingSpaces ?? null,
        powerBackup: w.powerBackup || null,
        waterSource: w.waterSource || null,
        internetReady: w.internetReady ?? null,
        floorAreaSqm: w.floorAreaSqm ?? null,
        floorLevel: w.floorLevel || null,
        units: w.units ?? null,
        fitOutState: w.fitOutState || null,
        plotSizeSqm: w.plotSizeSqm ?? null,
        titleDocType: w.titleDocType || null,
        surveyAvailable: w.surveyAvailable ?? null,
        topography: w.topography || null,
        accessRoad: w.accessRoad || null,
        fencing: w.fencing ?? null,
        state: w.state || null,
        city: w.city,
        area: w.area,
        lga: w.lga || null,
        latitude: w.latitude ?? null,
        longitude: w.longitude ?? null,
        geocodeAccuracy: w.geocodeAccuracy || null,
        streetAddress: w.streetAddress || null,
        fullAddressVisible: w.fullAddressVisible ?? false,
        rent: Math.round(rent),
        rentPeriod: (w.rentPeriod ?? "YEAR") as RentPeriod,
        currency: "NGN",
        agencyFee: agencyFeeAmount,
        agencyFeeMode,
        legalFee: legalFeeAmount,
        legalFeeMode,
        cautionDeposit: w.cautionDeposit ?? null,
        serviceCharge: w.serviceCharge ?? null,
        negotiable: w.negotiable ?? false,
        availableFrom: availableFromDate,
        minimumLease: w.minimumLease || null,
        listedByAgent: isInHouseAgent,
        offPlatformOwnerName: isInHouseAgent
          ? w.offPlatformOwnerName.trim() || null
          : null,
        offPlatformOwnerPhone: isInHouseAgent
          ? w.offPlatformOwnerPhone.trim() || null
          : null,
        status: initialStatus,
        ...(derived ?? {}),
        verificationStatus: "PENDING",
        verificationSignals: gate.signals as unknown as Prisma.InputJsonValue,
        submittedAt: now,
        approvedAt: now,
        goesLiveAt: now,
        photos: {
          create: w.photos.map((ph, i) => ({
            url: ph.url,
            isMain: ph.isMain ?? i === 0,
            order: i,
          })),
        },
      },
      select: { id: true, status: true },
    });

    return ok(created, { status: 201 });
  } catch (e) {
    console.error("[properties:POST] failed", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return err("server_error", `Could not create listing: ${msg}`, 500);
  }
}

function mapPropertyType(input: string): PropertyType | null {
  const v = input.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const allowed: PropertyType[] = [
    "FLAT", "HOUSE", "DUPLEX", "SELF_CONTAIN", "BUNGALOW", "COMMERCIAL", "LAND",
    "TERRACE", "DETACHED", "SEMI_DETACHED", "PENTHOUSE", "STUDIO", "MINI_FLAT", "SHARED_ROOM",
    "OFFICE", "SHOP", "WAREHOUSE", "COWORKING", "EVENT_CENTRE", "HOTEL_SHORTLET", "PLAZA_UNIT",
    "RESIDENTIAL_PLOT", "COMMERCIAL_PLOT", "AGRICULTURAL_LAND", "MIXED_USE_LAND",
  ];
  return allowed.includes(v as PropertyType) ? (v as PropertyType) : null;
}

function mapFurnishing(input: string): Furnishing | null {
  if (!input) return null;
  const v = input.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const allowed: Furnishing[] = ["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"];
  return allowed.includes(v as Furnishing) ? (v as Furnishing) : null;
}

// Re-export the wizard input type to avoid an unused-import warning in some toolchains.
export type { PropertyWizardSubmitInput };
