import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Server rendering reads zustand's *initial* state, so the store hook is replaced with one the test controls.
const wizard = vi.hoisted(() => ({
	data: { propertyKind: "RESIDENTIAL", bedrooms: null, bathrooms: null, briefDescription: "", size: null, yearBuilt: null, furnishing: "", floorNumber: "", condition: "", ownershipType: "", floorAreaSqm: null, floorLevel: "", units: null, fitOutState: "" } as Record<string, unknown>,
}));
vi.mock("@/stores/listPropertyStore", () => ({
	useListPropertyStore: (selector: (s: unknown) => unknown) => selector({ data: wizard.data, updateData: () => {} }),
}));
import { commercialFloorAreaPatch, commercialFloorLevelPatch } from "./commercial-fields";
import { DescriptionStep } from "./steps/DescriptionStep";
import { PropertyInfoStep } from "./steps/PropertyInfoStep";

// The unit-test config has no automatic JSX runtime; the components only need React when they render.
(globalThis as Record<string, unknown>).React = React;

const setKind = (propertyKind: "RESIDENTIAL" | "COMMERCIAL" | "LAND") => { wizard.data.propertyKind = propertyKind; };
const html = (c: () => React.ReactElement) => renderToStaticMarkup(c());

describe("commercial wizard asks each thing once (B13)", () => {
	beforeEach(() => setKind("RESIDENTIAL"));

	it("Property info still asks for floor area, floor level, units and fit-out for commercial", () => {
		setKind("COMMERCIAL");
		const out = html(() => React.createElement(PropertyInfoStep));
		for (const label of ["Floor Area", "Floor Level", "Number of Units", "Fit-out State"]) expect(out).toContain(label);
	});

	it("Description step no longer repeats size and floor for commercial", () => {
		setKind("COMMERCIAL");
		const out = html(() => React.createElement(DescriptionStep));
		expect(out).not.toContain("Property Size");
		expect(out).not.toContain(">Floor<");
	});

	it("Description step keeps the questions that aren't repeated, for commercial", () => {
		setKind("COMMERCIAL");
		const out = html(() => React.createElement(DescriptionStep));
		for (const label of ["Year Built", "Furnishing Status", "Property Condition", "Ownership Type"]) expect(out).toContain(label);
	});

	it("residential still sees every question in the Description step", () => {
		setKind("RESIDENTIAL");
		const out = html(() => React.createElement(DescriptionStep));
		for (const label of ["Property Size", "Floor", "Year Built", "Furnishing Status", "Property Condition", "Ownership Type"]) expect(out).toContain(label);
	});
});

describe("answers from Property info are mirrored into the fields the listing page reads", () => {
	it("floor area also fills size", () => expect(commercialFloorAreaPatch(120)).toEqual({ floorAreaSqm: 120, size: 120 }));
	it("clearing floor area clears size", () => expect(commercialFloorAreaPatch(null)).toEqual({ floorAreaSqm: null, size: null }));
	it("floor level also fills floorNumber", () => expect(commercialFloorLevelPatch("3rd")).toEqual({ floorLevel: "3rd", floorNumber: "3rd" }));
});
