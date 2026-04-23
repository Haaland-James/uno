import type { ListingObjective } from "@/stores/listPropertyStore";

export interface StepDef {
	key: string;
	label: string;
	/** Whether this step is included in the "Step X of N" counter. Overview and Review are not. */
	counted: boolean;
}

const COMMON_STEPS: StepDef[] = [
	{ key: "overview", label: "Overview", counted: false },
	{ key: "location", label: "Location", counted: true },
	{ key: "property-info", label: "Property Info", counted: true },
	{ key: "description", label: "Description", counted: true },
	{ key: "amenities", label: "Amenities", counted: true },
	{ key: "photos", label: "Photos", counted: true },
	{ key: "pricing", label: "Pricing", counted: true },
];

const RENT_LEASE_TAIL: StepDef[] = [
	{ key: "lease-terms", label: "Property Terms", counted: true },
	{ key: "contact", label: "Contact Info", counted: true },
	{ key: "review", label: "Review", counted: false },
];

const SELL_TAIL: StepDef[] = [
	{ key: "contact", label: "Contact Info", counted: true },
	{ key: "review", label: "Review", counted: false },
];

export function getSteps(objective: ListingObjective | null): StepDef[] {
	if (objective === "SELL") return [...COMMON_STEPS, ...SELL_TAIL];
	return [...COMMON_STEPS, ...RENT_LEASE_TAIL];
}

/** Counted step info: { current, total } for the "Step X of N" label, or null if uncounted. */
export function getCountedStepInfo(
	stepIndex: number,
	objective: ListingObjective | null
): { current: number; total: number } | null {
	const steps = getSteps(objective);
	const step = steps[stepIndex];
	if (!step?.counted) return null;
	const counted = steps.filter((s) => s.counted);
	const current = counted.findIndex((s) => s.key === step.key) + 1;
	return { current, total: counted.length };
}
