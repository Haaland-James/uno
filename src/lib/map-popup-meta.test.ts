import { describe, expect, it } from "vitest";
import { popupMetaLine } from "./map-popup-meta";

const base = { bedrooms: 0, bathrooms: 0, area: "Ewet", city: "Uyo" };

describe("popupMetaLine", () => {
	it("shows beds and baths for a house", () => {
		expect(popupMetaLine({ ...base, propertyType: "DUPLEX", bedrooms: 4, bathrooms: 5 })).toBe("4 bd · 5 ba · Ewet, Uyo");
	});
	it("keeps '0 bd' for a residential listing that really has none (a studio)", () => {
		expect(popupMetaLine({ ...base, propertyType: "STUDIO" })).toBe("0 bd · 0 ba · Ewet, Uyo");
	});
	it.each(["LAND", "RESIDENTIAL_PLOT", "AGRICULTURAL_LAND"])("shows only the place for land (%s)", (propertyType) => {
		expect(popupMetaLine({ ...base, propertyType })).toBe("Ewet, Uyo");
	});
	it.each(["COMMERCIAL", "OFFICE", "SHOP", "WAREHOUSE"])("shows only the place for commercial (%s)", (propertyType) => {
		expect(popupMetaLine({ ...base, propertyType, bedrooms: 3 })).toBe("Ewet, Uyo");
	});
});
