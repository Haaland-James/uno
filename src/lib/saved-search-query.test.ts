import { describe, expect, it } from "vitest";
import { criteriaToQuery } from "./saved-search-query";
import { buildPropertyWhere } from "./property-where";
import { COVERAGE } from "./coverage";

const base = { v: 1 as const };
const citiesOfAkwaIbom = COVERAGE.filter((n) => n.type === "city" && n.parent === "akwa-ibom").map((n) => n.name);

describe("criteriaToQuery", () => {
  it("maps each criteria field to the search API's query", () => {
    expect(criteriaToQuery({ ...base, category: "sale" })).toMatchObject({ listingType: ["SALE"] });
    expect(criteriaToQuery({ ...base, category: "lease" })).toMatchObject({ listingType: ["LEASE"] });
    expect(criteriaToQuery({ ...base, citySlug: "uyo" })).toMatchObject({ city: "Uyo" });
    expect(criteriaToQuery({ ...base, citySlug: "uyo", areaSlug: "ewet-housing" })).toMatchObject({ city: "Uyo", area: "Ewet Housing" });
    expect(criteriaToQuery({ ...base, beds: [2, 3], baths: [1] })).toMatchObject({ beds: [2, 3], baths: [1] });
    expect(criteriaToQuery({ ...base, type: ["FLAT", "DUPLEX"] })).toMatchObject({ type: ["FLAT", "DUPLEX"] });
    expect(criteriaToQuery({ ...base, furnishing: ["FULLY_FURNISHED"] })).toMatchObject({ furnishing: ["FULLY_FURNISHED"] });
    expect(criteriaToQuery({ ...base, amenities: ["Water Supply"] })).toMatchObject({ amenities: ["Water Supply"] });
    expect(criteriaToQuery({ ...base, minPrice: 500_000, maxPrice: 2_000_000 })).toMatchObject({ minPrice: 500_000, maxPrice: 2_000_000 });
    expect(criteriaToQuery({ ...base, verifiedOnly: true, availableNow: true })).toMatchObject({ verifiedOnly: true, availableNow: true });
    expect(criteriaToQuery({ ...base, q: "pool" })).toMatchObject({ q: "pool" });
  });

  it("a state-only search covers every city under that state, like the page", () => {
    expect(criteriaToQuery({ ...base, stateSlug: "akwa-ibom" })).toMatchObject({ cities: citiesOfAkwaIbom });
  });

  it("ignores sort, page and pageSize", () => {
    const q = criteriaToQuery({ ...base, sort: "price_desc" });
    expect(q).not.toHaveProperty("sort");
    expect(q).not.toHaveProperty("page");
    expect(q).not.toHaveProperty("pageSize");
  });

  it("builds the same where as the public search API for the same filters", () => {
    const q = criteriaToQuery({ ...base, category: "rent", citySlug: "uyo", beds: [2], maxPrice: 900_000 })!;
    expect(buildPropertyWhere(q)).toEqual(buildPropertyWhere({ listingType: ["RENT"], city: "Uyo", beds: [2], maxPrice: 900_000 }));
  });

  it.each([
    ["wrong version", { v: 2 }],
    ["not an object", "garbage"],
    ["null", null],
    ["unknown property type", { ...base, type: ["CASTLE"] }],
    ["a location slug that no longer resolves", { ...base, citySlug: "atlantis" }],
    ["an area slug that no longer resolves", { ...base, citySlug: "uyo", areaSlug: "nowhere" }],
  ])("returns null for %s, instead of widening the search", (_n, criteria) => {
    expect(criteriaToQuery(criteria)).toBeNull();
  });
});
