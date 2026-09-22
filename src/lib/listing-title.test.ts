import { expect, it } from "vitest";
import * as titles from "./listing-title";
import { PropertyType } from "@prisma/client";
import { getKindForPropertyType } from "../../config/constants";

it.each([
  ["OFFICE", "LEASE", "Office Space for Lease"],
  ["SHOP", "RENT", "Shop for Rent"],
  ["WAREHOUSE", "SALE", "Warehouse for Sale"],
  ["RESIDENTIAL_PLOT", "SALE", "Residential Plot for Sale"],
  ["AGRICULTURAL_LAND", "LEASE", "Agricultural Land for Lease"],
  ["SELF_CONTAIN", "RENT", "3 Bedroom Self Contain for Rent"],
  ["DETACHED", "SALE", "3 Bedroom Detached House for Sale"],
] as const)("labels %s without alternate labels or non-residential bedrooms", (propertyType, listingType, head) => {
  expect(titles.generateListingTitle({ ...flat, propertyKind: getKindForPropertyType(propertyType)!, propertyType, listingType })).toBe(`${head} in Ewet Housing Estate, Uyo`);
});

it("renders zero bedrooms as Studio without repeating Studio", () => {
  expect(titles.generateListingTitle({ ...flat, bedrooms: 0 })).toBe("Studio Flat for Rent in Ewet Housing Estate, Uyo");
  expect(titles.generateListingTitle({ ...flat, bedrooms: 0, propertyType: "STUDIO" })).toBe("Studio for Rent in Ewet Housing Estate, Uyo");
});
it("does not invent a bedroom count for null", () => {
  expect(titles.generateListingTitle({ ...flat, bedrooms: null })).toBe("Flat for Rent in Ewet Housing Estate, Uyo");
});
it("deduplicates trimmed case-insensitive locations and falls back to city", () => {
  expect(titles.generateListingTitle({ ...flat, area: " UYO " })).toBe("3 Bedroom Flat for Rent in Uyo");
  expect(titles.generateListingTitle({ ...flat, area: " " })).toBe("3 Bedroom Flat for Rent in Uyo");
});
it("clamps only the location tail to 100 characters", () => {
  const title = titles.generateListingTitle({ ...flat, area: "a".repeat(200) });
  expect(title).toHaveLength(100);
  expect(title.startsWith("3 Bedroom Flat for Rent in ")).toBe(true);
});
it("covers every actual Prisma enum including legacy types", () => {
  for (const propertyType of Object.values(PropertyType)) {
    const title = titles.generateListingTitle({ ...flat, propertyType, propertyKind: getKindForPropertyType(propertyType)! });
    expect(title.length).toBeGreaterThanOrEqual(10);
    expect(title.length).toBeLessThanOrEqual(100);
    expect(title).not.toMatch(/undefined|null|_ /);
  }
});

const flat = { propertyKind: "RESIDENTIAL", propertyType: "FLAT", listingType: "RENT", bedrooms: 3, area: "Ewet Housing Estate", city: "Uyo" } as const;

it("generates a residential title from facts, not marketing copy", () => {
  expect(titles.generateListingTitle(flat)).toBe("3 Bedroom Flat for Rent in Ewet Housing Estate, Uyo");
});
