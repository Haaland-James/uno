import { describe, it, expect } from "vitest";
import {
  savedSearchCriteriaSchema,
  createSavedSearchSchema,
  updateSavedSearchSchema,
} from "./saved-search";

describe("savedSearchCriteriaSchema", () => {
  it("accepts the minimum — just the version stamp", () => {
    expect(savedSearchCriteriaSchema.safeParse({ v: 1 }).success).toBe(true);
  });

  it("requires the version, and requires it to be 1", () => {
    // The version is what lets criteriaToSearchState migrate old rows; a row
    // without it could not be interpreted safely.
    expect(savedSearchCriteriaSchema.safeParse({}).success).toBe(false);
    expect(savedSearchCriteriaSchema.safeParse({ v: 2 }).success).toBe(false);
    expect(savedSearchCriteriaSchema.safeParse({ v: "1" }).success).toBe(false);
  });

  it("accepts a fully populated criteria object", () => {
    expect(
      savedSearchCriteriaSchema.safeParse({
        v: 1,
        category: "rent",
        stateSlug: "akwa-ibom",
        citySlug: "uyo",
        areaSlug: "ewet-housing",
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
      }).success
    ).toBe(true);
  });

  it("rejects a category outside the three", () => {
    expect(savedSearchCriteriaSchema.safeParse({ v: 1, category: "commercial" }).success).toBe(false);
  });

  it("rejects an empty slug rather than storing a useless one", () => {
    expect(savedSearchCriteriaSchema.safeParse({ v: 1, stateSlug: "" }).success).toBe(false);
  });

  it("caps every list so a stored row cannot grow unbounded", () => {
    const n = (len: number) => Array.from({ length: len }, () => 1);
    const s = (len: number, val = "x") => Array.from({ length: len }, () => val);

    expect(savedSearchCriteriaSchema.safeParse({ v: 1, beds: n(10) }).success).toBe(true);
    expect(savedSearchCriteriaSchema.safeParse({ v: 1, beds: n(11) }).success).toBe(false);
    expect(savedSearchCriteriaSchema.safeParse({ v: 1, baths: n(11) }).success).toBe(false);
    expect(savedSearchCriteriaSchema.safeParse({ v: 1, type: s(11) }).success).toBe(false);
    expect(savedSearchCriteriaSchema.safeParse({ v: 1, furnishing: s(6) }).success).toBe(false);
    expect(savedSearchCriteriaSchema.safeParse({ v: 1, amenities: s(21) }).success).toBe(false);
  });

  it("caps the free-text query length", () => {
    expect(savedSearchCriteriaSchema.safeParse({ v: 1, q: "a".repeat(201) }).success).toBe(false);
  });

  it("bounds bedroom and bathroom values", () => {
    expect(savedSearchCriteriaSchema.safeParse({ v: 1, beds: [21] }).success).toBe(false);
    expect(savedSearchCriteriaSchema.safeParse({ v: 1, beds: [-1] }).success).toBe(false);
    expect(savedSearchCriteriaSchema.safeParse({ v: 1, beds: [2.5] }).success).toBe(false);
  });

  it("refuses a negative price", () => {
    expect(savedSearchCriteriaSchema.safeParse({ v: 1, minPrice: -1 }).success).toBe(false);
  });
});

describe("createSavedSearchSchema", () => {
  const valid = { name: "Uyo 2-beds", criteria: { v: 1 } };

  it("accepts a named search with criteria", () => {
    expect(createSavedSearchSchema.safeParse(valid).success).toBe(true);
  });

  it("trims the name and requires it to be non-empty", () => {
    expect(createSavedSearchSchema.parse({ ...valid, name: "  Uyo  " }).name).toBe("Uyo");
    expect(createSavedSearchSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
    expect(createSavedSearchSchema.safeParse({ ...valid, name: "a".repeat(81) }).success).toBe(false);
  });

  it("requires the criteria to be valid, not merely present", () => {
    expect(createSavedSearchSchema.safeParse({ ...valid, criteria: {} }).success).toBe(false);
    expect(createSavedSearchSchema.safeParse({ name: "x" }).success).toBe(false);
  });

  it("leaves the notification flags unset when not given", () => {
    const parsed = createSavedSearchSchema.parse(valid);
    expect(parsed.notifyInstant).toBeUndefined();
    expect(parsed.notifyEmail).toBeUndefined();
  });
});

describe("updateSavedSearchSchema", () => {
  it("accepts an empty patch", () => {
    expect(updateSavedSearchSchema.safeParse({}).success).toBe(true);
  });

  it("accepts toggling active state and notifications independently", () => {
    expect(updateSavedSearchSchema.safeParse({ isActive: false }).success).toBe(true);
    expect(updateSavedSearchSchema.safeParse({ notifyEmail: true }).success).toBe(true);
  });

  it("does not let the criteria be swapped out on update", () => {
    // Changing what a saved search means would silently invalidate whatever
    // alerts have already been sent for it; callers create a new one instead.
    const parsed = updateSavedSearchSchema.parse({ criteria: { v: 1, q: "new" } } as never);
    expect(parsed).not.toHaveProperty("criteria");
  });

  it("still enforces the name bounds when a name is given", () => {
    expect(updateSavedSearchSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(updateSavedSearchSchema.safeParse({ name: "a".repeat(81) }).success).toBe(false);
  });
});
