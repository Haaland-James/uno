import type { ListPropertyData, ListingObjective } from "@/stores/listPropertyStore";

export interface StepDef {
	key: string;
	label: string;
	/** Whether this step is included in the "Step X of N" counter. Overview, Kind, and Review are not. */
	counted: boolean;
}

const OVERVIEW: StepDef = { key: "overview", label: "Overview", counted: false };
const KIND: StepDef = { key: "kind", label: "Property Kind", counted: false };
const LOCATION: StepDef = { key: "location", label: "Location", counted: true };
const PROPERTY_INFO: StepDef = { key: "property-info", label: "Property Info", counted: true };
const DESCRIPTION: StepDef = { key: "description", label: "Description", counted: true };
const AMENITIES: StepDef = { key: "amenities", label: "Amenities", counted: true };
const LAND_DETAILS: StepDef = { key: "land-details", label: "Land Details", counted: true };
const PHOTOS: StepDef = { key: "photos", label: "Photos", counted: true };
const PRICING: StepDef = { key: "pricing", label: "Pricing", counted: true };
const LEASE_TERMS: StepDef = { key: "lease-terms", label: "Property Terms", counted: true };
const CONTACT: StepDef = { key: "contact", label: "Contact Info", counted: true };
const REVIEW: StepDef = { key: "review", label: "Review", counted: false };

export type WizardKind = "RESIDENTIAL" | "COMMERCIAL" | "LAND" | "";

/**
 * Build the step list based on the user's objective and chosen property kind.
 * - Land flow skips bedrooms/bathrooms/amenities — replaces them with a single LandDetailsStep.
 * - Commercial flow keeps Property Info but the step itself adapts its fields.
 * - SELL skips the lease-terms step.
 */
export function getSteps(
	objective: ListingObjective | null,
	kind: WizardKind = ""
): StepDef[] {
	const head: StepDef[] = [OVERVIEW, KIND, LOCATION];

	let middle: StepDef[];
	if (kind === "LAND") {
		middle = [LAND_DETAILS, PHOTOS, PRICING];
	} else {
		middle = [PROPERTY_INFO, DESCRIPTION, AMENITIES, PHOTOS, PRICING];
	}

	const tail: StepDef[] =
		objective === "SELL"
			? [CONTACT, REVIEW]
			: [LEASE_TERMS, CONTACT, REVIEW];

	return [...head, ...middle, ...tail];
}

/** Convenience: derive the step list from the full wizard data object. */
export function getStepsFromData(data: Pick<ListPropertyData, "objective" | "propertyKind">): StepDef[] {
	return getSteps(data.objective, data.propertyKind as WizardKind);
}

/** Counted step info: { current, total } for the "Step X of N" label, or null if uncounted. */
export function getCountedStepInfo(
	stepIndex: number,
	objective: ListingObjective | null,
	kind: WizardKind = ""
): { current: number; total: number } | null {
	const steps = getSteps(objective, kind);
	const step = steps[stepIndex];
	if (!step?.counted) return null;
	const counted = steps.filter((s) => s.counted);
	const current = counted.findIndex((s) => s.key === step.key) + 1;
	return { current, total: counted.length };
}
