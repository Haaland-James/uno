import { describe, expect, it } from "vitest";
import { propertyWizardSubmitSchema } from "@/lib/validators/property";
import { getSteps, type WizardKind } from "./steps";
import { MAPPED_FIELDS, resolveFieldErrors, stepForField, type FieldContext } from "./field-steps";

const flow = (objective: "SELL" | "RENT" | "LEASE", kind: WizardKind, agent = false): FieldContext => ({
	kind,
	objective,
	flowKeys: getSteps(objective, kind, agent).map((s) => s.key),
});

describe("field → step map", () => {
	it("covers every field of the submit schema, so none can fall back to a bare 'Invalid request'", () => {
		const schemaFields = Object.keys(propertyWizardSubmitSchema.shape).sort();
		expect([...MAPPED_FIELDS].sort()).toEqual(schemaFields);
	});

	it("maps every field to a step that exists in at least one flow (or null in the flows where it isn't shown)", () => {
		const everyStep = new Set(
			(["SELL", "RENT", "LEASE"] as const).flatMap((o) =>
				(["RESIDENTIAL", "COMMERCIAL", "LAND"] as const).flatMap((k) => flow(o, k, true).flowKeys)
			)
		);
		for (const field of MAPPED_FIELDS) {
			const targets = (["SELL", "RENT"] as const).flatMap((o) =>
				(["RESIDENTIAL", "COMMERCIAL", "LAND"] as const).map((k) => stepForField(field, flow(o, k, true)))
			);
			expect(targets.some((t) => t !== null), field).toBe(true);
			for (const t of targets) if (t) expect(everyStep.has(t), `${field} → ${t}`).toBe(true);
		}
	});

	it("sends each field to the step that owns it", () => {
		const rentHouse = flow("RENT", "RESIDENTIAL");
		expect(stepForField("area", rentHouse)).toBe("location");
		expect(stepForField("bedrooms", rentHouse)).toBe("property-info");
		expect(stepForField("yearBuilt", rentHouse)).toBe("description");
		expect(stepForField("parkingSpaces", rentHouse)).toBe("amenities");
		expect(stepForField("photos", rentHouse)).toBe("photos");
		expect(stepForField("rent", rentHouse)).toBe("pricing");
		expect(stepForField("leaseTerms", rentHouse)).toBe("lease-terms");
		expect(stepForField("contactEmail", rentHouse)).toBe("contact");
	});

	it("a field's step can differ by kind", () => {
		expect(stepForField("briefDescription", flow("RENT", "RESIDENTIAL"))).toBe("property-info");
		expect(stepForField("briefDescription", flow("SELL", "LAND"))).toBe("land-details");
		// Commercial mirrors size / floor into Property info and hides the Description copies.
		expect(stepForField("size", flow("RENT", "RESIDENTIAL"))).toBe("description");
		expect(stepForField("size", flow("RENT", "COMMERCIAL"))).toBe("property-info");
		expect(stepForField("floorNumber", flow("RENT", "COMMERCIAL"))).toBe("property-info");
	});

	it("a field's step can differ by objective: sale price only on a sale, rent fields never on one", () => {
		expect(stepForField("salePrice", flow("SELL", "RESIDENTIAL"))).toBe("pricing");
		expect(stepForField("salePrice", flow("RENT", "RESIDENTIAL"))).toBeNull();
		expect(stepForField("rent", flow("SELL", "RESIDENTIAL"))).toBeNull();
		expect(stepForField("leaseTerms", flow("SELL", "RESIDENTIAL"))).toBeNull(); // no lease-terms step on a sale
	});

	it("never targets a step that isn't in the current flow", () => {
		expect(stepForField("plotSizeSqm", flow("SELL", "RESIDENTIAL"))).toBeNull(); // land-details isn't in a house flow
		expect(stepForField("bedrooms", flow("SELL", "LAND"))).toBeNull(); // property-info isn't in a land flow
		expect(stepForField("offPlatformOwnerName", flow("SELL", "RESIDENTIAL", false))).toBeNull(); // owner step is agents only
		expect(stepForField("offPlatformOwnerName", flow("SELL", "RESIDENTIAL", true))).toBe("owner");
		expect(stepForField("not-a-field", flow("SELL", "RESIDENTIAL"))).toBeNull();
	});
});

describe("resolveFieldErrors", () => {
	const sale = flow("SELL", "RESIDENTIAL");

	it("a price over the limit opens Pricing with the message under the sale price field", () => {
		const r = resolveFieldErrors({ salePrice: ["Maximum price is ₦1,000,000,000,000"] }, sale);
		expect(r).toEqual({
			messages: { salePrice: "Maximum price is ₦1,000,000,000,000" },
			step: "pricing",
			firstField: "salePrice",
			toast: "Maximum price is ₦1,000,000,000,000",
		});
	});

	it("two failing fields: both shown, the first in wizard order wins, the toast says 'and 1 more'", () => {
		const r = resolveFieldErrors(
			{ contactEmail: ["Enter a valid contact email"], salePrice: ["Maximum price is ₦1,000,000,000,000"] },
			sale
		);
		expect(r.step).toBe("pricing"); // Pricing comes before Contact in the flow, though 'contactEmail' sorts first alphabetically
		expect(r.firstField).toBe("salePrice");
		expect(r.messages).toEqual({
			salePrice: "Maximum price is ₦1,000,000,000,000",
			contactEmail: "Enter a valid contact email",
		});
		expect(r.toast).toBe("Maximum price is ₦1,000,000,000,000 and 1 more");
	});

	it("orders fields inside one step by the form's own order, not alphabetically", () => {
		const r = resolveFieldErrors({ streetAddress: ["Street address is required"], area: ["Area is required"], state: ["State is required"] }, sale);
		expect(r.firstField).toBe("state");
		expect(r.toast).toBe("State is required and 2 more");
	});

	it("three or more: counts the rest", () => {
		const r = resolveFieldErrors(
			{ bedrooms: ["Bedrooms can't be more than 20"], yearBuilt: ["Year built can't be in the future"], contactEmail: ["Enter a valid contact email"] },
			sale
		);
		expect(r.step).toBe("property-info");
		expect(r.toast).toBe("Bedrooms can't be more than 20 and 2 more");
	});

	it("an unknown field is shown in the toast only and the person stays put", () => {
		const r = resolveFieldErrors({ mysteryField: ["Something is off with the mystery field"] }, sale);
		expect(r.step).toBeNull();
		expect(r.firstField).toBeNull();
		expect(r.messages).toEqual({});
		expect(r.toast).toBe("Something is off with the mystery field");
	});

	it("an unknown field alongside a known one still counts in the toast, but does not move the person", () => {
		const r = resolveFieldErrors({ mysteryField: ["Mystery is off"], contactEmail: ["Enter a valid contact email"] }, sale);
		expect(r.step).toBe("contact");
		expect(r.messages).toEqual({ contactEmail: "Enter a valid contact email" });
		expect(r.toast).toBe("Enter a valid contact email and 1 more");
	});

	it("a field whose step isn't in this flow is treated like an unknown one", () => {
		const r = resolveFieldErrors({ plotSizeSqm: ["Plot size must be a whole number"] }, sale); // house flow has no land step
		expect(r.step).toBeNull();
		expect(r.toast).toBe("Plot size must be a whole number");
	});

	it("a land listing's plot size error opens Land Details", () => {
		const r = resolveFieldErrors({ plotSizeSqm: ["Plot size must be a whole number"] }, flow("SELL", "LAND"));
		expect(r).toMatchObject({ step: "land-details", firstField: "plotSizeSqm" });
	});

	it("an empty response falls back to a plain sentence", () => {
		expect(resolveFieldErrors({}, sale).toast).toMatch(/need fixing/);
	});

	it("edit page: update-schema keys are translated to the wizard's field names", () => {
		const editFlow: FieldContext = { kind: "RESIDENTIAL", objective: "RENT", flowKeys: ["location", "property-info", "description", "amenities", "photos", "pricing", "lease-terms", "contact"] };
		const r = resolveFieldErrors(
			{ description: ["Description is too long (2000 characters at most)"], availabilityStatus: ["Choose a valid option for availability"] },
			editFlow,
			"edit"
		);
		expect(r.step).toBe("property-info");
		expect(r.messages).toEqual({
			briefDescription: "Description is too long (2000 characters at most)",
			availability: "Choose a valid option for availability",
		});
	});

	it("edit page: a price over the limit opens Pricing under the rent field", () => {
		const editFlow: FieldContext = { kind: "RESIDENTIAL", objective: "RENT", flowKeys: ["location", "pricing"] };
		const r = resolveFieldErrors({ rent: ["Maximum price is ₦1,000,000,000,000"] }, editFlow, "edit");
		expect(r).toMatchObject({ step: "pricing", firstField: "rent", messages: { rent: "Maximum price is ₦1,000,000,000,000" } });
	});
});
