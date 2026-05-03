/**
 * URL ↔ search-state translator for `/properties/[category]/[state]/[city]?...filters`.
 *
 * Categories are dimension-mixed (Option B from 2026-04-24 decision):
 *   rent | sale | lease  → filter by listingType
 *   commercial | land     → filter by propertyType (any listingType)
 *
 * Areas live in query params, never path: `?area=ewet-housing`.
 */

import { findBySlug, findByName, type LocationNode } from "./coverage";

/**
 * Listing-type categories — these are the path segments under /properties.
 * Commercial and Land are NOT categories: they are propertyType filters that
 * cut ACROSS all three listing types (you can rent commercial, sell commercial,
 * etc.). They live as `?type=COMMERCIAL` / `?type=LAND` query params.
 */
export type SearchCategory = "rent" | "sale" | "lease";
export const CATEGORIES: SearchCategory[] = ["rent", "sale", "lease"];

export const CATEGORY_LABELS: Record<SearchCategory, string> = {
  rent: "For Rent",
  sale: "For Sale",
  lease: "For Lease",
};

export function isCategory(s: string): s is SearchCategory {
  return (CATEGORIES as string[]).includes(s);
}

/** Parsed URL state after consuming both path slug and query params. */
export interface SearchState {
  category?: SearchCategory;
  state?: LocationNode;
  city?: LocationNode;
  area?: LocationNode;
  q?: string;
  beds: number[];
  baths: number[];
  type: string[];        // PropertyType[] (subset, never includes COMMERCIAL/LAND when category is one of those)
  furnishing: string[];
  amenities: string[];
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly: boolean;
  availableNow: boolean;
  sort?: "price_asc" | "price_desc" | "newest" | "most_viewed";
  page: number;
}

const BLANK: SearchState = {
  beds: [],
  baths: [],
  type: [],
  furnishing: [],
  amenities: [],
  verifiedOnly: false,
  availableNow: false,
  page: 1,
};

function intArr(s: string | null): number[] {
  if (!s) return [];
  return s.split(",").map((x) => parseInt(x, 10)).filter((n) => !isNaN(n));
}

function strArr(s: string | null): string[] {
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function intOpt(s: string | null): number | undefined {
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return isNaN(n) ? undefined : n;
}

/**
 * Parse a `/properties/[[...slug]]` route into search state.
 *
 * @param slug   URL path segments after `/properties/` (e.g. `["rent", "akwa-ibom", "uyo"]`)
 * @param query  URLSearchParams from the request
 */
export function parseSearchUrl(slug: string[], query: URLSearchParams): SearchState {
  const state: SearchState = { ...BLANK };

  // ── Path: [category]/[state]/[city] ──────────────────────────
  const [seg1, seg2, seg3] = slug;
  if (seg1 && isCategory(seg1)) {
    state.category = seg1;
  }
  if (seg2) {
    const node = findBySlug(seg2);
    if (node?.type === "state") state.state = node;
  }
  if (seg3) {
    const node = findBySlug(seg3);
    if (node?.type === "city" && (!state.state || node.parent === state.state.slug)) {
      state.city = node;
    }
  }

  // ── Query params ──────────────────────────────────────────────
  state.q = query.get("q") ?? undefined;
  state.beds = intArr(query.get("beds"));
  state.baths = intArr(query.get("baths"));
  state.type = strArr(query.get("type"));
  state.furnishing = strArr(query.get("furnishing"));
  state.amenities = strArr(query.get("amenities"));
  state.minPrice = intOpt(query.get("minPrice"));
  state.maxPrice = intOpt(query.get("maxPrice"));
  state.verifiedOnly = query.get("verifiedOnly") === "true";
  state.availableNow = query.get("availableNow") === "true";

  const sort = query.get("sort");
  if (sort === "price_asc" || sort === "price_desc" || sort === "newest" || sort === "most_viewed") {
    state.sort = sort;
  }

  const page = parseInt(query.get("page") ?? "1", 10);
  state.page = isNaN(page) || page < 1 ? 1 : page;

  // Area is query-only
  const areaSlug = query.get("area");
  if (areaSlug) {
    const node = findBySlug(areaSlug);
    if (node?.type === "area") state.area = node;
  }

  return state;
}

/** Build a `/properties/...` URL from a (partial) search state. */
export function buildSearchUrl(s: Partial<SearchState>): string {
  const path: string[] = ["/properties"];
  if (s.category) {
    path.push(s.category);
    if (s.state) {
      path.push(s.state.slug);
      if (s.city && s.city.parent === s.state.slug) {
        path.push(s.city.slug);
      }
    }
  } else if (s.state) {
    // No category but a state — use a permissive default
    path.push("rent", s.state.slug);
    if (s.city && s.city.parent === s.state.slug) {
      path.push(s.city.slug);
    }
  }

  const sp = new URLSearchParams();
  if (s.q) sp.set("q", s.q);
  if (s.area) sp.set("area", s.area.slug);
  if (s.beds?.length) sp.set("beds", s.beds.join(","));
  if (s.baths?.length) sp.set("baths", s.baths.join(","));
  if (s.type?.length) sp.set("type", s.type.join(","));
  if (s.furnishing?.length) sp.set("furnishing", s.furnishing.join(","));
  if (s.amenities?.length) sp.set("amenities", s.amenities.join(","));
  if (s.minPrice !== undefined) sp.set("minPrice", String(s.minPrice));
  if (s.maxPrice !== undefined) sp.set("maxPrice", String(s.maxPrice));
  if (s.verifiedOnly) sp.set("verifiedOnly", "true");
  if (s.availableNow) sp.set("availableNow", "true");
  if (s.sort) sp.set("sort", s.sort);
  if (s.page && s.page > 1) sp.set("page", String(s.page));

  const qs = sp.toString();
  return path.join("/") + (qs ? `?${qs}` : "");
}

/** Convert SearchState → propertiesClient.list params (the API filter shape). */
export function searchStateToApiParams(s: SearchState): import("./clients/properties").PropertyListParams {
  // Listing type from category (rent/sale/lease)
  let listingType: ("RENT" | "LEASE" | "SALE")[] | undefined;
  switch (s.category) {
    case "rent": listingType = ["RENT"]; break;
    case "sale": listingType = ["SALE"]; break;
    case "lease": listingType = ["LEASE"]; break;
  }

  // City filter — when only state is set, derive list of cities under it
  // so "Akwa Ibom" returns ALL listings in Uyo, Eket, etc., not just exact-state matches.
  const cityFilter = s.city?.name;
  const cityListForState = !cityFilter && s.state ? citiesUnderState(s.state.slug) : undefined;

  return {
    q: s.q,
    listingType,
    type: s.type.length ? s.type : undefined,
    city: cityFilter,
    cities: cityListForState,
    area: s.area?.name,
    beds: s.beds.length ? s.beds : undefined,
    baths: s.baths.length ? s.baths : undefined,
    furnishing: s.furnishing.length ? s.furnishing : undefined,
    amenities: s.amenities.length ? s.amenities : undefined,
    minPrice: s.minPrice,
    maxPrice: s.maxPrice,
    verifiedOnly: s.verifiedOnly || undefined,
    availableNow: s.availableNow || undefined,
    sort: s.sort,
    page: s.page,
    pageSize: 20,
  };
}

/** Returns names of all city nodes whose parent slug matches the given state. */
function citiesUnderState(stateSlug: string): string[] | undefined {
  // Lazy import to avoid circular dep at module-init time
  const { COVERAGE } = require("./coverage") as typeof import("./coverage");
  const cities = COVERAGE
    .filter((n) => n.type === "city" && n.parent === stateSlug)
    .map((n) => n.name);
  return cities.length > 0 ? cities : undefined;
}

/**
 * Pretty-print the current scope for a heading.
 *   "For Rent in Uyo, Akwa Ibom"
 *   "For Sale in Akwa Ibom"
 *   "All Properties for Rent" — when no location set
 */
export function describeScope(s: SearchState): string {
  const cat = s.category ? CATEGORY_LABELS[s.category] : "All Properties";
  const place = s.city
    ? `${s.city.name}, ${s.state?.name ?? ""}`.replace(/, $/, "")
    : s.state?.name;
  if (!place) return `All Properties ${cat.toLowerCase()}`.replace("for ", "for ");
  return `${cat} in ${place}`;
}

/**
 * Resolve a free-text query into a path-based URL when it matches a covered
 * location, falling back to `?q=...` otherwise.
 *
 * Used by the simple search inputs (BrowseHeader, /feed) so typing "Uyo"
 * yields /properties/rent/akwa-ibom/uyo instead of an opaque ?q=Uyo.
 */
/** Build a search URL from a picked autocomplete LocationNode. */
export function nodeToSearchUrl(
  node: LocationNode,
  category: SearchCategory = "rent"
): string {
  let stateNode: LocationNode | undefined;
  let cityNode: LocationNode | undefined;
  let areaNode: LocationNode | undefined;
  if (node.type === "state") {
    stateNode = node;
  } else if (node.type === "city") {
    cityNode = node;
    if (node.parent) stateNode = findBySlug(node.parent);
  } else if (node.type === "area") {
    areaNode = node;
    if (node.parent) cityNode = findBySlug(node.parent);
    if (cityNode?.parent) stateNode = findBySlug(cityNode.parent);
  }
  return buildSearchUrl({ category, state: stateNode, city: cityNode, area: areaNode });
}

export function resolveTextToUrl(
  text: string,
  fallbackCategory: SearchCategory = "rent"
): string {
  const trimmed = text.trim();
  if (!trimmed) return "/properties";

  const node = findByName(trimmed);
  if (node) {
    let stateNode: LocationNode | undefined;
    let cityNode: LocationNode | undefined;
    let areaNode: LocationNode | undefined;
    if (node.type === "state") stateNode = node;
    else if (node.type === "city") {
      cityNode = node;
      if (node.parent) stateNode = findBySlug(node.parent);
    } else if (node.type === "area") {
      areaNode = node;
      if (node.parent) cityNode = findBySlug(node.parent);
      if (cityNode?.parent) stateNode = findBySlug(cityNode.parent);
    }
    return buildSearchUrl({ category: fallbackCategory, state: stateNode, city: cityNode, area: areaNode });
  }

  // Fall back to full-text search
  return `/properties?q=${encodeURIComponent(trimmed)}`;
}

/** Just the location label, for showing in a sub-heading without the category. */
export function describePlace(s: SearchState): string | null {
  // Area in URL but no city — derive parent city/state from coverage so we
  // can render "Ewet Housing, Uyo, Akwa Ibom" instead of just "Akwa Ibom"
  if (s.area && !s.city) {
    const parentCity = s.area.parent ? findBySlug(s.area.parent) : undefined;
    const parentState =
      parentCity?.parent ? findBySlug(parentCity.parent) : s.state;
    const parts = [s.area.name, parentCity?.name, parentState?.name].filter(Boolean);
    return parts.join(", ");
  }
  if (s.area && s.city) return `${s.area.name}, ${s.city.name}, ${s.state?.name ?? ""}`.replace(/, $/, "");
  if (s.city) return `${s.city.name}, ${s.state?.name ?? ""}`.replace(/, $/, "");
  if (s.state) return s.state.name;
  return null;
}

/**
 * When the user arrives via a "Latest" or "Hot" carousel See All, the URL
 * carries `?sort=newest|most_viewed` — surface that intent in the heading
 * instead of just saying "X properties for rent in [Place]".
 */
export function describeSortContext(sort: SearchState["sort"]): string | null {
  switch (sort) {
    case "newest": return "Latest";
    case "most_viewed": return "Hot";
    case "price_asc": return "Lowest priced";
    case "price_desc": return "Highest priced";
    default: return null;
  }
}
