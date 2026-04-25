import type { SearchState } from "./search-url";
import { findBySlug } from "./coverage";
import type { SavedSearchCriteria } from "./validators/saved-search";

/** Serialize a SearchState into the on-the-wire SavedSearch.criteria payload. */
export function searchStateToCriteria(s: SearchState): SavedSearchCriteria {
  return {
    v: 1,
    category: s.category,
    stateSlug: s.state?.slug,
    citySlug: s.city?.slug,
    areaSlug: s.area?.slug,
    q: s.q,
    beds: s.beds.length ? s.beds : undefined,
    baths: s.baths.length ? s.baths : undefined,
    type: s.type.length ? s.type : undefined,
    furnishing: s.furnishing.length ? s.furnishing : undefined,
    amenities: s.amenities.length ? s.amenities : undefined,
    minPrice: s.minPrice,
    maxPrice: s.maxPrice,
    verifiedOnly: s.verifiedOnly || undefined,
    availableNow: s.availableNow || undefined,
    sort: s.sort,
  };
}

/** Hydrate a stored criteria back into a SearchState (resolves slugs to LocationNodes). */
export function criteriaToSearchState(c: SavedSearchCriteria): Partial<SearchState> {
  return {
    category: c.category,
    state: c.stateSlug ? findBySlug(c.stateSlug) ?? undefined : undefined,
    city: c.citySlug ? findBySlug(c.citySlug) ?? undefined : undefined,
    area: c.areaSlug ? findBySlug(c.areaSlug) ?? undefined : undefined,
    q: c.q,
    beds: c.beds ?? [],
    baths: c.baths ?? [],
    type: c.type ?? [],
    furnishing: c.furnishing ?? [],
    amenities: c.amenities ?? [],
    minPrice: c.minPrice,
    maxPrice: c.maxPrice,
    verifiedOnly: c.verifiedOnly ?? false,
    availableNow: c.availableNow ?? false,
    sort: c.sort,
  };
}

/** Human-readable summary of criteria, e.g. "For Rent · Uyo · 2+ beds · ≤ ₦500k". */
export function summarizeCriteria(c: SavedSearchCriteria): string {
  const parts: string[] = [];
  if (c.category) {
    parts.push(c.category === "rent" ? "For Rent" : c.category === "sale" ? "For Sale" : "For Lease");
  }
  const place =
    (c.areaSlug && findBySlug(c.areaSlug)?.name) ||
    (c.citySlug && findBySlug(c.citySlug)?.name) ||
    (c.stateSlug && findBySlug(c.stateSlug)?.name);
  if (place) parts.push(place);
  if (c.beds?.length) parts.push(`${c.beds.join(",")}+ beds`);
  if (c.type?.length === 1) parts.push(c.type[0].toLowerCase().replace(/_/g, " "));
  if (c.minPrice || c.maxPrice) {
    const min = c.minPrice ? `₦${c.minPrice.toLocaleString("en-NG")}` : "";
    const max = c.maxPrice ? `₦${c.maxPrice.toLocaleString("en-NG")}` : "";
    parts.push(min && max ? `${min}–${max}` : max ? `≤ ${max}` : `≥ ${min}`);
  }
  if (c.verifiedOnly) parts.push("Verified only");
  return parts.join(" · ") || "All properties";
}
