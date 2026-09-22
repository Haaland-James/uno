import { expect, it } from "vitest";
import { isStepValid } from "../components/listing/list-property/validation";
import { useListPropertyStore } from "../stores/listPropertyStore";
import * as titles from "./listing-title";

it.each([
  ["RESIDENTIAL", "property-info", { bedrooms: 2, bathrooms: 1 }],
  ["COMMERCIAL", "property-info", { floorAreaSqm: 50, fitOutState: "FITTED" }],
  ["LAND", "land-details", { plotSizeSqm: 500, titleDocType: "C_OF_O" }],
] as const)("validates %s facts without a client title", (propertyKind, step, facts) => {
  expect(isStepValid(step, { ...useListPropertyStore.getState().data, ...facts, propertyKind })).toBe(true);
  expect(useListPropertyStore.getState().data).not.toHaveProperty("title");
});

it("derives draft hints from facts and ignores stale persisted titles", () => {
  expect(titles.generateDraftTitle({ title: "Spam", propertyType: "FLAT", objective: "SELL", bedrooms: 2, city: "Uyo" })).toBe("2 Bedroom Flat for Sale in Uyo");
  expect(titles.generateDraftTitle({ propertyType: "WAREHOUSE", objective: "LEASE", bedrooms: null, city: "Uyo" })).toBe("Warehouse for Lease in Uyo");
});
it.each([null, [], {}, { title: "Legacy title" }, { propertyType: "__proto__", objective: "RENT", city: "Uyo" }, { propertyType: "FLAT", objective: "RENT", city: "Uyo", bedrooms: "2" }, { propertyType: "FLAT", objective: "RENT", city: "Uyo", bedrooms: -1 }, { propertyType: "SHOP", objective: "__proto__", city: "Uyo" }])("keeps incomplete or malformed drafts untitled: %j", (data) => {
  expect(titles.generateDraftTitle(data)).toBeNull();
});
