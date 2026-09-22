import type { PropertyKind, PropertyType, ListingType } from "@prisma/client";
import { PROPERTY_TYPES, PROPERTY_TYPES_BY_KIND, LISTING_TYPE_LABELS, getKindForPropertyType } from "../../config/constants";

export interface ListingTitleInput {
  propertyKind: PropertyKind;
  propertyType: PropertyType;
  listingType: ListingType;
  bedrooms: number | null;
  area: string;
  city: string;
}

/** Draft JSON is untrusted and may predate the title-free wizard. */
export function generateDraftTitle(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;
  const type = [...PROPERTY_TYPES, ...Object.values(PROPERTY_TYPES_BY_KIND).flat()]
    .find((t) => t.value === d.propertyType);
  const kind = type && getKindForPropertyType(type.value);
  if (!type || !kind || !["SELL", "RENT", "LEASE"].includes(d.objective as string)) return null;
  const city = typeof d.city === "string" ? d.city.trim() : "";
  const area = typeof d.area === "string" ? d.area.trim() : "";
  if (!city && !area) return null;
  if (kind === "RESIDENTIAL" && (typeof d.bedrooms !== "number" || !Number.isInteger(d.bedrooms) || d.bedrooms < 0 || d.bedrooms > 20)) return null;
  return generateListingTitle({
    propertyKind: kind, propertyType: type.value as PropertyType,
    listingType: d.objective === "SELL" ? "SALE" : d.objective as ListingType,
    bedrooms: kind === "RESIDENTIAL" ? d.bedrooms as number : null, area, city,
  });
}

export function generateListingTitle(input: ListingTitleInput): string {
  // Legacy rows may have the default kind even for commercial/land types.
  const kind = getKindForPropertyType(input.propertyType) ?? input.propertyKind;
  const label = (PROPERTY_TYPES_BY_KIND[kind].find((t) => t.value === input.propertyType)
    ?? PROPERTY_TYPES.find((t) => t.value === input.propertyType))!.label.split(" / ")[0];
  const beds = kind !== "RESIDENTIAL" || input.bedrooms === null || input.propertyType === "STUDIO"
    ? "" : input.bedrooms === 0 ? "Studio " : `${input.bedrooms} Bedroom `;
  const head = `${beds}${label} ${LISTING_TYPE_LABELS[input.listingType]}`;
  const area = input.area.trim();
  const city = input.city.trim();
  const location = area.toLowerCase() === city.toLowerCase()
    ? city : [area, city].filter(Boolean).join(", ");
  // Even the shortest head clears 10 characters. Only trim the location tail.
  return location ? `${head} in ${location.slice(0, 100 - head.length - 4)}`.trimEnd() : head;
}
