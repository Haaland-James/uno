import { describe, it, expect } from "vitest";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  isCategory,
  parseSearchUrl,
  buildSearchUrl,
  searchStateToApiParams,
  describeScope,
  describePlace,
  describeSortContext,
  nodeToSearchUrl,
  resolveTextToUrl,
  type SearchState,
} from "./search-url";
import { findBySlug } from "./coverage";

const qs = (s = "") => new URLSearchParams(s);
const node = (slug: string) => findBySlug(slug)!;

describe("isCategory", () => {
  it("accepts the three listing-type categories", () => {
    for (const c of CATEGORIES) expect(isCategory(c)).toBe(true);
  });

  it("rejects propertyType filters that look like categories", () => {
    // Commercial and Land cut ACROSS listing types, so they live in ?type=,
    // never in the path. Treating them as categories would produce URLs the
    // route cannot resolve.
    expect(isCategory("commercial")).toBe(false);
    expect(isCategory("land")).toBe(false);
  });

  it("rejects unknown strings", () => {
    expect(isCategory("")).toBe(false);
    expect(isCategory("Rent")).toBe(false); // case-sensitive
  });

  it("has a label for every category", () => {
    for (const c of CATEGORIES) expect(CATEGORY_LABELS[c]).toBeTruthy();
  });
});

describe("parseSearchUrl — path segments", () => {
  it("returns blank state for an empty URL", () => {
    expect(parseSearchUrl([], qs())).toEqual({
      beds: [],
      baths: [],
      type: [],
      furnishing: [],
      amenities: [],
      verifiedOnly: false,
      availableNow: false,
      page: 1,
      q: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    });
  });

  it("reads category, state and city from the path", () => {
    const s = parseSearchUrl(["rent", "akwa-ibom", "uyo"], qs());
    expect(s.category).toBe("rent");
    expect(s.state?.slug).toBe("akwa-ibom");
    expect(s.city?.slug).toBe("uyo");
  });

  it("ignores a first segment that is not a category but still reads the state", () => {
    const s = parseSearchUrl(["bogus", "akwa-ibom"], qs());
    expect(s.category).toBeUndefined();
    expect(s.state?.slug).toBe("akwa-ibom");
  });

  it("ignores a state segment that is not a state node", () => {
    const s = parseSearchUrl(["rent", "uyo"], qs());
    expect(s.state).toBeUndefined();
  });

  it("drops a city that does not belong to the declared state", () => {
    // Guards against hand-edited URLs like /rent/akwa-ibom/abuja, which would
    // otherwise filter to Abuja while the heading claimed Akwa Ibom.
    const s = parseSearchUrl(["rent", "akwa-ibom", "abuja"], qs());
    expect(s.state?.slug).toBe("akwa-ibom");
    expect(s.city).toBeUndefined();
  });

  it("accepts any city when no valid state was given", () => {
    const s = parseSearchUrl(["rent", "not-a-state", "uyo"], qs());
    expect(s.state).toBeUndefined();
    expect(s.city?.slug).toBe("uyo");
  });

  it("ignores an area slug in the city position", () => {
    const s = parseSearchUrl(["rent", "akwa-ibom", "ewet-housing"], qs());
    expect(s.city).toBeUndefined();
  });
});

describe("parseSearchUrl — query params", () => {
  it("splits comma-separated numeric lists and discards junk entries", () => {
    const s = parseSearchUrl([], qs("beds=1,2,x&baths=3"));
    expect(s.beds).toEqual([1, 2]);
    expect(s.baths).toEqual([3]);
  });

  it("splits and trims string lists", () => {
    const s = parseSearchUrl([], qs("type=FLAT,%20HOUSE&amenities=POOL,,GYM"));
    expect(s.type).toEqual(["FLAT", "HOUSE"]);
    expect(s.amenities).toEqual(["POOL", "GYM"]);
  });

  it("reads price bounds and leaves them undefined when absent or unparseable", () => {
    expect(parseSearchUrl([], qs("minPrice=100000&maxPrice=500000"))).toMatchObject({
      minPrice: 100000,
      maxPrice: 500000,
    });
    expect(parseSearchUrl([], qs("minPrice=abc")).minPrice).toBeUndefined();
    expect(parseSearchUrl([], qs()).maxPrice).toBeUndefined();
  });

  it("treats the boolean flags as strictly the string 'true'", () => {
    expect(parseSearchUrl([], qs("verifiedOnly=true")).verifiedOnly).toBe(true);
    expect(parseSearchUrl([], qs("verifiedOnly=TRUE")).verifiedOnly).toBe(false);
    expect(parseSearchUrl([], qs("verifiedOnly=1")).verifiedOnly).toBe(false);
    expect(parseSearchUrl([], qs("availableNow=true")).availableNow).toBe(true);
  });

  it("accepts only the four known sorts", () => {
    expect(parseSearchUrl([], qs("sort=price_asc")).sort).toBe("price_asc");
    expect(parseSearchUrl([], qs("sort=most_viewed")).sort).toBe("most_viewed");
    expect(parseSearchUrl([], qs("sort=drop_table")).sort).toBeUndefined();
  });

  it("clamps page to at least 1", () => {
    expect(parseSearchUrl([], qs("page=3")).page).toBe(3);
    expect(parseSearchUrl([], qs("page=0")).page).toBe(1);
    expect(parseSearchUrl([], qs("page=-5")).page).toBe(1);
    expect(parseSearchUrl([], qs("page=abc")).page).toBe(1);
    expect(parseSearchUrl([], qs()).page).toBe(1);
  });

  it("takes area from the query, never the path", () => {
    const s = parseSearchUrl(["rent", "akwa-ibom", "uyo"], qs("area=ewet-housing"));
    expect(s.area?.slug).toBe("ewet-housing");
  });

  it("ignores an area param that names a city or an unknown place", () => {
    expect(parseSearchUrl([], qs("area=uyo")).area).toBeUndefined();
    expect(parseSearchUrl([], qs("area=atlantis")).area).toBeUndefined();
  });
});

describe("buildSearchUrl", () => {
  it("returns the bare listing page for empty state", () => {
    expect(buildSearchUrl({})).toBe("/properties");
  });

  it("builds the full category/state/city path", () => {
    expect(
      buildSearchUrl({ category: "sale", state: node("akwa-ibom"), city: node("uyo") })
    ).toBe("/properties/sale/akwa-ibom/uyo");
  });

  it("defaults to rent when a state is given without a category", () => {
    expect(buildSearchUrl({ state: node("akwa-ibom") })).toBe("/properties/rent/akwa-ibom");
  });

  it("omits a city that does not belong to the state", () => {
    expect(
      buildSearchUrl({ category: "rent", state: node("akwa-ibom"), city: node("abuja") })
    ).toBe("/properties/rent/akwa-ibom");
  });

  it("omits a city when there is no state to hang it off", () => {
    expect(buildSearchUrl({ category: "rent", city: node("uyo") })).toBe("/properties/rent");
  });

  it("puts the area in the query string", () => {
    expect(
      buildSearchUrl({ category: "rent", state: node("akwa-ibom"), city: node("uyo"), area: node("ewet-housing") })
    ).toBe("/properties/rent/akwa-ibom/uyo?area=ewet-housing");
  });

  it("omits falsy filters rather than serialising them", () => {
    const url = buildSearchUrl({
      category: "rent",
      beds: [],
      type: [],
      verifiedOnly: false,
      availableNow: false,
      page: 1,
    });
    expect(url).toBe("/properties/rent");
  });

  it("omits page 1 but serialises later pages", () => {
    expect(buildSearchUrl({ category: "rent", page: 1 })).toBe("/properties/rent");
    expect(buildSearchUrl({ category: "rent", page: 2 })).toBe("/properties/rent?page=2");
  });

  it("serialises the filters that are set", () => {
    const url = buildSearchUrl({
      category: "rent",
      beds: [2, 3],
      type: ["FLAT"],
      minPrice: 100000,
      verifiedOnly: true,
      sort: "price_asc",
    });
    expect(url).toContain("beds=2%2C3");
    expect(url).toContain("type=FLAT");
    expect(url).toContain("minPrice=100000");
    expect(url).toContain("verifiedOnly=true");
    expect(url).toContain("sort=price_asc");
  });
});

describe("parse ⇄ build round-trip", () => {
  it("survives a full round-trip without losing state", () => {
    const original: SearchState = {
      category: "rent",
      state: node("akwa-ibom"),
      city: node("uyo"),
      area: node("ewet-housing"),
      q: "duplex",
      beds: [2, 3],
      baths: [2],
      type: ["FLAT", "HOUSE"],
      furnishing: ["FULLY_FURNISHED"],
      amenities: ["POOL", "GYM"],
      minPrice: 100000,
      maxPrice: 900000,
      verifiedOnly: true,
      availableNow: true,
      sort: "price_desc",
      page: 4,
    };

    const url = buildSearchUrl(original);
    const [path, query] = url.split("?");
    const slug = path.replace("/properties/", "").split("/");

    expect(parseSearchUrl(slug, qs(query))).toEqual(original);
  });

  it("round-trips a bare category with no filters", () => {
    const url = buildSearchUrl({ category: "lease" });
    expect(url).toBe("/properties/lease");
    expect(parseSearchUrl(["lease"], qs()).category).toBe("lease");
  });
});

describe("searchStateToApiParams", () => {
  const base = (over: Partial<SearchState> = {}): SearchState => ({
    beds: [],
    baths: [],
    type: [],
    furnishing: [],
    amenities: [],
    verifiedOnly: false,
    availableNow: false,
    page: 1,
    ...over,
  });

  it("maps each category to its listing type", () => {
    expect(searchStateToApiParams(base({ category: "rent" })).listingType).toEqual(["RENT"]);
    expect(searchStateToApiParams(base({ category: "sale" })).listingType).toEqual(["SALE"]);
    expect(searchStateToApiParams(base({ category: "lease" })).listingType).toEqual(["LEASE"]);
  });

  it("leaves listingType unset when there is no category", () => {
    expect(searchStateToApiParams(base()).listingType).toBeUndefined();
  });

  it("expands a state-only scope into every city under it", () => {
    // Otherwise "Akwa Ibom" would match nothing, since listings carry a city,
    // not a state.
    const p = searchStateToApiParams(base({ state: node("akwa-ibom") }));
    expect(p.city).toBeUndefined();
    expect(p.cities).toEqual(
      expect.arrayContaining(["Uyo", "Eket", "Ikot Ekpene", "Abak", "Oron"])
    );
  });

  it("filters by the single city when one is chosen", () => {
    const p = searchStateToApiParams(base({ state: node("akwa-ibom"), city: node("uyo") }));
    expect(p.city).toBe("Uyo");
    expect(p.cities).toBeUndefined();
  });

  it("sends area by display name", () => {
    expect(searchStateToApiParams(base({ area: node("ewet-housing") })).area).toBe("Ewet Housing");
  });

  it("collapses empty lists and false flags to undefined", () => {
    // The API treats `undefined` as "no filter"; sending [] or false would
    // otherwise narrow the query to nothing.
    const p = searchStateToApiParams(base());
    expect(p.type).toBeUndefined();
    expect(p.beds).toBeUndefined();
    expect(p.baths).toBeUndefined();
    expect(p.furnishing).toBeUndefined();
    expect(p.amenities).toBeUndefined();
    expect(p.verifiedOnly).toBeUndefined();
    expect(p.availableNow).toBeUndefined();
  });

  it("passes the paging window through", () => {
    const p = searchStateToApiParams(base({ page: 3 }));
    expect(p.page).toBe(3);
    expect(p.pageSize).toBe(20);
  });
});

describe("nodeToSearchUrl", () => {
  it("builds a state URL from a state node", () => {
    expect(nodeToSearchUrl(node("akwa-ibom"))).toBe("/properties/rent/akwa-ibom");
  });

  it("resolves a city up to its state", () => {
    expect(nodeToSearchUrl(node("uyo"))).toBe("/properties/rent/akwa-ibom/uyo");
  });

  it("resolves an area up through city to state", () => {
    expect(nodeToSearchUrl(node("ewet-housing"))).toBe(
      "/properties/rent/akwa-ibom/uyo?area=ewet-housing"
    );
  });

  it("honours a non-default category", () => {
    expect(nodeToSearchUrl(node("uyo"), "sale")).toBe("/properties/sale/akwa-ibom/uyo");
  });
});

describe("resolveTextToUrl", () => {
  it("returns the bare listing page for empty input", () => {
    expect(resolveTextToUrl("")).toBe("/properties");
    expect(resolveTextToUrl("   ")).toBe("/properties");
  });

  it("turns a recognised place into a path URL rather than a text query", () => {
    expect(resolveTextToUrl("Uyo")).toBe("/properties/rent/akwa-ibom/uyo");
    expect(resolveTextToUrl("  uyo ")).toBe("/properties/rent/akwa-ibom/uyo");
  });

  it("resolves an alias", () => {
    expect(resolveTextToUrl("AKS")).toBe("/properties/rent/akwa-ibom");
  });

  it("resolves an area to its full hierarchy", () => {
    expect(resolveTextToUrl("Ewet Housing")).toBe(
      "/properties/rent/akwa-ibom/uyo?area=ewet-housing"
    );
  });

  it("falls back to full-text search for anything unrecognised", () => {
    expect(resolveTextToUrl("cheap duplex")).toBe("/properties?q=cheap%20duplex");
  });

  it("encodes characters that would otherwise break the query string", () => {
    expect(resolveTextToUrl("a&b=c")).toBe("/properties?q=a%26b%3Dc");
  });

  it("honours the fallback category", () => {
    expect(resolveTextToUrl("Uyo", "sale")).toBe("/properties/sale/akwa-ibom/uyo");
  });
});

describe("describeScope", () => {
  const base = (over: Partial<SearchState> = {}): SearchState => ({
    beds: [],
    baths: [],
    type: [],
    furnishing: [],
    amenities: [],
    verifiedOnly: false,
    availableNow: false,
    page: 1,
    ...over,
  });

  it("names the category and the city with its state", () => {
    expect(describeScope(base({ category: "rent", state: node("akwa-ibom"), city: node("uyo") }))).toBe(
      "For Rent in Uyo, Akwa Ibom"
    );
  });

  it("names the state alone when no city is chosen", () => {
    expect(describeScope(base({ category: "sale", state: node("akwa-ibom") }))).toBe(
      "For Sale in Akwa Ibom"
    );
  });

  it("drops the trailing comma when a city has no resolved state", () => {
    expect(describeScope(base({ category: "rent", city: node("uyo") }))).toBe("For Rent in Uyo");
  });

  it("falls back to a category-only heading when there is no place", () => {
    expect(describeScope(base({ category: "rent" }))).toBe("All Properties for rent");
  });

  it("stutters when neither a category nor a place is set", () => {
    // KNOWN BUG, documented rather than asserted-as-correct: with no category
    // `cat` is already "All Properties", and the no-place branch prefixes
    // "All Properties " again. See search-url.ts describeScope().
    expect(describeScope(base())).toBe("All Properties all properties");
  });
});

describe("describePlace", () => {
  const base = (over: Partial<SearchState> = {}): SearchState => ({
    beds: [],
    baths: [],
    type: [],
    furnishing: [],
    amenities: [],
    verifiedOnly: false,
    availableNow: false,
    page: 1,
    ...over,
  });

  it("returns null when no location is set", () => {
    expect(describePlace(base())).toBeNull();
  });

  it("returns the state name alone", () => {
    expect(describePlace(base({ state: node("akwa-ibom") }))).toBe("Akwa Ibom");
  });

  it("returns city then state", () => {
    expect(describePlace(base({ state: node("akwa-ibom"), city: node("uyo") }))).toBe(
      "Uyo, Akwa Ibom"
    );
  });

  it("returns area, city then state when all three are known", () => {
    expect(
      describePlace(base({ state: node("akwa-ibom"), city: node("uyo"), area: node("ewet-housing") }))
    ).toBe("Ewet Housing, Uyo, Akwa Ibom");
  });

  it("derives the missing city and state from an area-only URL", () => {
    // ?area=ewet-housing with no path segments still reads as the full
    // hierarchy rather than collapsing to just the area.
    expect(describePlace(base({ area: node("ewet-housing") }))).toBe(
      "Ewet Housing, Uyo, Akwa Ibom"
    );
  });

  it("drops the trailing comma when the state is unknown", () => {
    expect(describePlace(base({ city: node("uyo") }))).toBe("Uyo");
  });
});

describe("describeSortContext", () => {
  it("names the carousel intents that bring users in", () => {
    expect(describeSortContext("newest")).toBe("Latest");
    expect(describeSortContext("most_viewed")).toBe("Hot");
  });

  it("names the price sorts", () => {
    expect(describeSortContext("price_asc")).toBe("Lowest priced");
    expect(describeSortContext("price_desc")).toBe("Highest priced");
  });

  it("returns null when there is no sort", () => {
    expect(describeSortContext(undefined)).toBeNull();
  });
});
