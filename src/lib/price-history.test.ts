import { expect, it } from "vitest";
import { priceChanged, type PricePoint } from "./price-history";

const base: PricePoint = { rent: 150000, rentPeriod: "YEAR", listingType: "RENT" };

it("is false when nothing changed", () => {
	expect(priceChanged(base, { ...base })).toBe(false);
});

it.each([
	[{ rent: 120000 }],
	[{ rentPeriod: "MONTH" as const }],
	[{ listingType: "SALE" as const }],
])("is true when %j changes", (patch) => {
	expect(priceChanged(base, { ...base, ...patch })).toBe(true);
});
