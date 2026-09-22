import { describe, it, expect } from "vitest";
import {
  searchStateToCriteria,
  criteriaToSearchState,
  summarizeCriteria,
} from "./saved-search-mapper";
import type { SearchState } from "./search-url";
import type { SavedSearchCriteria } from "./validators/saved-search";
import { savedSearchCriteriaSchema } from "./validators/saved-search";
import { findBySlug } from "./coverage";

const node = (slug: string) => findBySlug(slug)!;

const state = (over: Partial<SearchState> = {}): SearchState => ({
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

describe("searchStateToCriteria", () => {
  it("stamps the schema version", () => {
    // criteriaToSearchState keys its migrations off this.
    expect(searchStateToCriteria(state()).v).toBe(1);
  });

  it("stores locations as slugs, not whole nodes", () => {
    // Slugs keep the stored row small and let coverage.ts stay the source of
    // truth for names, so renaming a place does not strand saved searches.
    const c = searchStateToCriteria(
      state({ state: node("akwa-ibom"), city: node("uyo"), area: node("ewet-housing") })
    );
    expect(c).toMatchObject({
      stateSlug: "akwa-ibom",
      citySlug: "uyo",
      areaSlug: "ewet-housing",
    });
    expect(JSON.stringify(c)).not.toContain("Akwa Ibom");
  });

  it("drops empty lists and false flags instead of storing them", () => {
    const c = searchStateToCriteria(state());
    expect(c.beds).toBeUndefined();
    expect(c.baths).toBeUndefined();
    expect(c.type).toBeUndefined();
    expect(c.furnishing).toBeUndefined();
    expect(c.amenities).toBeUndefined();
    expect(c.verifiedOnly).toBeUndefined();
    expect(c.availableNow).toBeUndefined();
  });

  it("does not carry the page number into a saved search", () => {
    // A saved search is a standing query, not a scroll position.
    expect(searchStateToCriteria(state({ page: 7 }))).not.toHaveProperty("page");
  });

  it("produces output the stored-criteria schema accepts", () => {
    const c = searchStateToCriteria(
      state({
        category: "rent",
        state: node("akwa-ibom"),
        city: node("uyo"),
        q: "duplex",
        beds: [2, 3],
        type: ["FLAT"],
        minPrice: 100000,
        maxPrice: 900000,
        verifiedOnly: true,
        sort: "newest",
      })
    );
    expect(savedSearchCriteriaSchema.safeParse(c).success).toBe(true);
  });
});

describe("criteriaToSearchState", () => {
  it("re-hydrates slugs back into coverage nodes", () => {
    const s = criteriaToSearchState({
      v: 1,
      stateSlug: "akwa-ibom",
      citySlug: "uyo",
      areaSlug: "ewet-housing",
    });
    expect(s.state?.name).toBe("Akwa Ibom");
    expect(s.city?.name).toBe("Uyo");
    expect(s.area?.name).toBe("Ewet Housing");
  });

  it("restores omitted lists as empty arrays, not undefined", () => {
    // Consumers index into these directly, so the shape has to be complete.
    const s = criteriaToSearchState({ v: 1 });
    expect(s.beds).toEqual([]);
    expect(s.baths).toEqual([]);
    expect(s.type).toEqual([]);
    expect(s.furnishing).toEqual([]);
    expect(s.amenities).toEqual([]);
    expect(s.verifiedOnly).toBe(false);
    expect(s.availableNow).toBe(false);
  });

  it("degrades gracefully when a saved slug no longer exists", () => {
    // A place could be removed from coverage after a search was saved; the
    // rest of the criteria must still restore.
    const s = criteriaToSearchState({ v: 1, stateSlug: "atlantis", q: "duplex" });
    expect(s.state).toBeUndefined();
    expect(s.q).toBe("duplex");
  });
});

describe("criteria round-trip", () => {
  it("survives state → criteria → state", () => {
    const original = state({
      category: "sale",
      state: node("akwa-ibom"),
      city: node("uyo"),
      area: node("ewet-housing"),
      q: "duplex",
      beds: [2, 3],
      baths: [2],
      type: ["FLAT"],
      furnishing: ["FULLY_FURNISHED"],
      amenities: ["POOL"],
      minPrice: 100000,
      maxPrice: 900000,
      verifiedOnly: true,
      availableNow: true,
      sort: "price_asc",
    });

    const restored = criteriaToSearchState(searchStateToCriteria(original));

    // Page is intentionally not round-tripped.
    const { page, ...rest } = original;
    expect(restored).toEqual(rest);
  });
});

describe("summarizeCriteria", () => {
  it("falls back to a catch-all label for empty criteria", () => {
    expect(summarizeCriteria({ v: 1 })).toBe("All properties");
  });

  it("labels each category", () => {
    expect(summarizeCriteria({ v: 1, category: "rent" })).toBe("For Rent");
    expect(summarizeCriteria({ v: 1, category: "sale" })).toBe("For Sale");
    expect(summarizeCriteria({ v: 1, category: "lease" })).toBe("For Lease");
  });

  it("names the most specific place available", () => {
    const base: SavedSearchCriteria = { v: 1, stateSlug: "akwa-ibom", citySlug: "uyo" };
    expect(summarizeCriteria(base)).toContain("Uyo");
    expect(summarizeCriteria({ ...base, areaSlug: "ewet-housing" })).toContain("Ewet Housing");
    expect(summarizeCriteria({ v: 1, stateSlug: "akwa-ibom" })).toContain("Akwa Ibom");
  });

  it("joins parts with a middot", () => {
    expect(summarizeCriteria({ v: 1, category: "rent", citySlug: "uyo" })).toBe("For Rent · Uyo");
  });

  it("summarises beds", () => {
    expect(summarizeCriteria({ v: 1, beds: [2] })).toBe("2+ beds");
  });

  it("names a single property type in prose, and stays quiet about several", () => {
    expect(summarizeCriteria({ v: 1, type: ["SELF_CONTAIN"] })).toBe("self contain");
    expect(summarizeCriteria({ v: 1, type: ["FLAT", "HOUSE"] })).toBe("All properties");
  });

  it("renders a price ceiling, floor and range differently", () => {
    const n = (v: number) => v.toLocaleString("en-NG");
    expect(summarizeCriteria({ v: 1, maxPrice: 500000 })).toBe(`≤ ₦${n(500000)}`);
    expect(summarizeCriteria({ v: 1, minPrice: 100000 })).toBe(`≥ ₦${n(100000)}`);
    expect(summarizeCriteria({ v: 1, minPrice: 100000, maxPrice: 500000 })).toBe(
      `₦${n(100000)}–₦${n(500000)}`
    );
  });

  it("flags a verified-only search", () => {
    expect(summarizeCriteria({ v: 1, verifiedOnly: true })).toBe("Verified only");
    expect(summarizeCriteria({ v: 1, verifiedOnly: false })).toBe("All properties");
  });

  it("composes the whole summary in a stable order", () => {
    const n = (v: number) => v.toLocaleString("en-NG");
    expect(
      summarizeCriteria({
        v: 1,
        category: "rent",
        citySlug: "uyo",
        beds: [2],
        type: ["FLAT"],
        maxPrice: 500000,
        verifiedOnly: true,
      })
    ).toBe(`For Rent · Uyo · 2+ beds · flat · ≤ ₦${n(500000)} · Verified only`);
  });
});
