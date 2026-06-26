import type { Property, PropertyPhoto, User, LandlordProfile } from "@prisma/client";
import type { PropertyCardData, PropertyDetailData } from "@/types/property";
import { fallbackCoordsFor } from "@/lib/area-coords";
import { privatize } from "@/lib/privacy";

type PropertyWithPhotos = Property & {
  photos: PropertyPhoto[];
};

type PropertyWithLandlord = PropertyWithPhotos & {
  landlord: User & { landlordProfile: LandlordProfile | null };
};

/**
 * Maps a Prisma Property + photos to the lightweight card DTO.
 *
 * `opts.revealAddress` — pass `true` when the caller is the owner or an admin
 * who is allowed to see the unredacted location (e.g. My Listings). Public
 * surfaces must leave this false so `fullAddressVisible=false` listings get
 * jittered coords + `addressPrivate: true`.
 */
export function toCardDto(
  p: PropertyWithPhotos,
  isFavourited = false,
  opts: { revealAddress?: boolean } = {}
): PropertyCardData {
  const photos = p.photos
    .sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0) || a.order - b.order)
    .map((ph) => ({ url: ph.url, isMain: ph.isMain }));

  const resolved = resolveCoords(p);
  const effectivelyVisible = opts.revealAddress || p.fullAddressVisible;
  const priv = privatize(p.id, resolved.lng, resolved.lat, effectivelyVisible);

  return {
    id: p.id,
    title: p.title,
    propertyType: p.propertyType,
    listingType: p.listingType,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    sizeSqm: p.size ?? null,
    area: p.area,
    city: p.city,
    rent: p.rent,
    rentPeriod: p.rentPeriod,
    currency: p.currency,
    negotiable: p.negotiable,
    amenities: p.amenities,
    photos,
    verificationStatus: p.verificationStatus,
    availabilityStatus: p.availabilityStatus,
    isFavourited,
    createdAt: p.createdAt,
    latitude: priv.lat,
    longitude: priv.lng,
    addressPrivate: priv.addressPrivate,
    listedByAgent: p.listedByAgent,
    isFeatured: p.isFeatured,
  };
}

/** Resolve coords for a Prisma Property, falling back to city/area approximations. */
function resolveCoords(p: PropertyWithPhotos): { lat: number | null; lng: number | null } {
  if (typeof p.latitude === "number" && typeof p.longitude === "number") {
    return { lat: p.latitude, lng: p.longitude };
  }
  // Use a stable salt per property so the fallback pin doesn't move between requests.
  const salt = hashString(p.id);
  const fb = fallbackCoordsFor(p.city, p.area, salt);
  return fb ? { lat: fb.lat, lng: fb.lng } : { lat: null, lng: null };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Maps to the full detail DTO. Hides streetAddress unless fullAddressVisible. */
export function toDetailDto(
  p: PropertyWithLandlord,
  isFavourited = false,
  opts: { revealAddress?: boolean } = {}
): PropertyDetailData {
  const card = toCardDto(p, isFavourited, opts);
  const showFullAddress = opts.revealAddress || p.fullAddressVisible;

  const daysOnUno = Math.max(
    0,
    Math.floor((Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Fees: simple computed defaults until landlords can configure these per-listing.
  const isSale = p.listingType === "SALE";
  // For rent/lease: normalise to the annual figure for the fees breakdown.
  // For sale: price is the asking price as-is, no period conversion.
  const annualRent = isSale
    ? p.rent
    : p.rentPeriod === "YEAR"
    ? p.rent
    : p.rent * 12;
  const priceLabel = isSale
    ? "Asking Price"
    : p.rentPeriod === "MONTH"
    ? "Monthly Rent"
    : "Annual Rent";
  const additional: { label: string; amount: number; period: string }[] = [];
  if (p.agencyFee) additional.push({ label: "Agency Fee", amount: p.agencyFee, period: "once" });
  if (p.cautionDeposit) additional.push({ label: "Caution Deposit", amount: p.cautionDeposit, period: "once" });
  if (!isSale && p.serviceCharge) additional.push({ label: "Service Charge", amount: p.serviceCharge, period: "annually" });

  return {
    ...card,
    streetAddress: showFullAddress ? p.streetAddress ?? undefined : undefined,
    description: p.description ?? undefined,
    listingStatus:
      p.listingType === "SALE"
        ? "For Sale"
        : p.listingType === "LEASE"
        ? "For Lease"
        : p.availabilityStatus === "AVAILABLE_NOW"
        ? "For Rent"
        : "Coming Soon",
    daysOnUno,
    views: p.views,
    favourites: p.savedCount,
    fees: {
      annualRent,
      priceLabel,
      legalFeePercent: 10,
      agentFeePercent: 10,
      totalPackage: isSale
        ? formatPackage(annualRent)
        : formatPackage(annualRent + (p.agencyFee ?? 0) + (p.cautionDeposit ?? 0)),
      additional,
      additionalNote: "Additional fees are typically required before move-in.",
    },
    additionalInfo: buildAdditionalInfo(p),
    features: p.amenities.slice(0, 6),
    listedBy: p.listedByAgent
      ? { name: "UNO", company: "UNO Verified Listing" }
      : {
          name: p.landlord.name,
          company: p.landlord.landlordProfile?.bio ?? "",
        },
    agent: p.listedByAgent
      ? {
          name: p.landlord.name,
          slug: p.landlord.agentSlug ?? null,
          photo: p.landlord.agentPhoto ?? p.landlord.photo ?? null,
          bio: p.landlord.agentBio ?? null,
        }
      : null,
    listingUpdated: formatRelativeDate(p.updatedAt),
    unoChecked: p.verifiedAt ? formatRelativeDate(p.verifiedAt) : "Pending verification",
    landlordId: p.landlord.id,
    contact: {
      hasWhatsApp: !!(p.landlord.landlordProfile?.whatsappNumber || p.landlord.phone),
      hasPhone: !!p.landlord.phone,
      hasEmail: !!p.landlord.email,
    },
  };
}

function buildAdditionalInfo(p: Property): { label: string; value: string }[] {
  const info: { label: string; value: string }[] = [];
  if (p.yearBuilt) info.push({ label: "Year Built", value: String(p.yearBuilt) });
  if (p.size) info.push({ label: "Size", value: `${p.size} sqm` });
  if (p.furnishing) info.push({ label: "Furnishing", value: prettyEnum(p.furnishing) });
  if (p.condition) info.push({ label: "Condition", value: p.condition });
  if (p.floorNumber) info.push({ label: "Floor", value: p.floorNumber });
  if (p.minimumLease) info.push({ label: "Minimum Lease", value: p.minimumLease });
  return info;
}

function prettyEnum(s: string): string {
  return s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPackage(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}m`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(amount);
}

function formatRelativeDate(d: Date): string {
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toISOString().slice(0, 10);
}
