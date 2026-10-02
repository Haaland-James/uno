import { z, type ZodTypeAny } from "zod";
import type { ListPropertyData } from "@/stores/listPropertyStore";
import { MAX_PRICE, propertyWizardSubmitSchema } from "@/lib/validators/property";
import { plainErrorMap } from "@/lib/validators/plain-errors";
import { MAPPED_FIELDS, stepForField } from "./field-steps";
import type { WizardKind } from "./steps";

/** Same sentence the server sends for a price over the typo guard. */
export const PRICE_TOO_LARGE = `Maximum price is ₦${MAX_PRICE.toLocaleString("en-NG")}`;

/** Message to show under a price field, or null when the value is fine (or empty). */
export function priceError(value: number | null | undefined): string | null {
	return typeof value === "number" && value > MAX_PRICE ? PRICE_TOO_LARGE : null;
}

/** Steps that have rules; anything else (a step key that doesn't exist) is never "valid". */
const KNOWN_STEPS = new Set([
	"overview", "kind", "location", "owner", "property-info", "land-details", "description",
	"amenities", "photos", "pricing", "lease-terms", "contact", "review",
]);

export type Problems = Record<string, string>;

const isBlank = (v: unknown): boolean =>
	v === null || v === undefined || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

/** The fee fields hold { mode, value }: they're empty when no value was entered. */
const isEmptyValue = (v: unknown): boolean =>
	v !== null && typeof v === "object" && !Array.isArray(v) && "value" in v
		? isBlank((v as { value: unknown }).value)
		: isBlank(v);

/** What the server receives for a field (the wizard sends `photos` as { url, isMain } rows, not `photoUrls`). */
function valueForField(name: string, data: ListPropertyData): unknown {
	if (name === "photos") return (data.photoUrls ?? []).map((url, i) => ({ url, isMain: i === data.mainPhotoIndex }));
	return (data as unknown as Record<string, unknown>)[name];
}

/**
 * Rules only the wizard has: what must be filled in before Continue. Returns the
 * sentence to show, or null when the field is fine (or isn't required). The wording
 * follows the server's ("Enter a valid contact email", "Add at least one photo").
 */
function requiredProblem(name: string, data: ListPropertyData): string | null {
	const text = (v: string | null | undefined) => (v ?? "").trim();
	const num = (v: unknown) => (typeof v === "number" ? v : null);
	switch (name) {
		case "objective": return data.objective ? null : "Choose what you're listing";
		case "role": return data.role ? null : "Choose your role";
		case "propertyKind": return data.propertyKind ? null : "Choose a property kind";
		case "propertyType": return text(data.propertyType) ? null : "Choose a property type";
		case "state": return text(data.state) ? null : "Choose a state";
		case "lga": return text(data.lga) ? null : "Choose an LGA";
		case "area": return text(data.area) ? null : "Enter the area";
		case "streetAddress": return text(data.streetAddress) ? null : "Enter the street address";
		case "offPlatformOwnerName": return text(data.offPlatformOwnerName).length >= 2 ? null : "Enter the owner's name";
		case "offPlatformOwnerPhone": return text(data.offPlatformOwnerPhone).length >= 7 ? null : "Enter a valid phone number for the owner";
		case "bedrooms": return data.bedrooms !== null && data.bedrooms !== undefined ? null : "Choose the number of bedrooms";
		case "bathrooms": return data.bathrooms !== null && data.bathrooms !== undefined ? null : "Choose the number of bathrooms";
		case "floorAreaSqm":
			if (num(data.floorAreaSqm) === null) return "Enter the floor area";
			return (data.floorAreaSqm as number) > 0 ? null : "Floor area must be more than zero";
		case "fitOutState": return text(data.fitOutState) ? null : "Choose the fit-out state";
		case "plotSizeSqm":
			if (num(data.plotSizeSqm) === null) return "Enter the plot size";
			return (data.plotSizeSqm as number) > 0 ? null : "Plot size must be more than zero";
		case "titleDocType": return text(data.titleDocType) ? null : "Choose the title document";
		case "condition": return text(data.condition) ? null : "Choose the property condition";
		case "ownershipType": return text(data.ownershipType) ? null : "Choose the ownership type";
		case "photos": return (data.photoUrls ?? []).length >= 5 ? null : "Add at least 5 photos";
		case "salePrice": return (num(data.salePrice) ?? 0) > 0 ? null : "Enter a price";
		case "rent":
			if (!num(data.rent)) return "Enter a price";
			return (data.rent as number) >= 10000 ? null : "Price must be at least ₦10,000";
		case "minimumLease": return data.propertyKind === "LAND" || text(data.minimumLease) ? null : "Choose the minimum lease period";
		case "contactFirstName": return text(data.contactFirstName) ? null : "Enter your first name";
		case "contactLastName": return text(data.contactLastName) ? null : "Enter your last name";
		case "contactEmail": return /^\S+@\S+\.\S+$/.test(data.contactEmail ?? "") ? null : "Enter a valid contact email";
		case "contactPhone": return text(data.contactPhone).length >= 7 ? null : "Enter a valid contact phone number";
		default: return null;
	}
}

/**
 * The server's rule for this one field, run through the same plain-language error
 * map, so the sentence is identical to what a refused save would show.
 */
function serverProblem(name: string, data: ListPropertyData): string | null {
	const rule = (propertyWizardSubmitSchema.shape as Record<string, ZodTypeAny | undefined>)[name];
	if (!rule) return null;
	// Wrapped in an object so the issue's path carries the field name (the error map reads it).
	const result = z.object({ [name]: rule }).safeParse({ [name]: valueForField(name, data) }, { errorMap: plainErrorMap });
	return result.success ? null : result.error.issues[0]?.message ?? null;
}

/**
 * The sentence for one field, or null when it is fine. A missing required value
 * says what to do ("Enter a price"); a value that is present is checked by the
 * server's own rule; an empty optional field never has a problem.
 */
export function fieldProblem(name: string, data: ListPropertyData): string | null {
	const required = requiredProblem(name, data);
	if (required) return required;
	if (isEmptyValue(valueForField(name, data))) return null;
	return serverProblem(name, data);
}

/**
 * Every problem on a step, field → sentence, in the order the fields appear in
 * the wizard schema. Empty means the person may continue. Which fields a step
 * has depends on the kind and objective (`stepForField`), so a field the chosen
 * kind hides is never a problem.
 */
export function stepProblems(stepKey: string, data: ListPropertyData): Problems {
	if (!KNOWN_STEPS.has(stepKey)) return { [stepKey]: "This step isn't available" };
	const ctx = { kind: (data.propertyKind || "") as WizardKind, objective: data.objective ?? null, flowKeys: [stepKey] };
	const out: Problems = {};
	for (const field of MAPPED_FIELDS) {
		if (stepForField(field, ctx) !== stepKey) continue;
		const problem = fieldProblem(field, data);
		if (problem) out[field] = problem;
	}
	// A role / property type only makes sense after the objective / kind is chosen: don't pile on.
	if (out.objective) delete out.role;
	if (out.propertyKind) delete out.propertyType;
	// Top-to-bottom as on screen, so "the first problem" is the one nearest the top.
	const rank = (f: string) => (SCREEN_ORDER.indexOf(f) === -1 ? SCREEN_ORDER.length : SCREEN_ORDER.indexOf(f));
	return Object.fromEntries(Object.entries(out).sort(([a], [b]) => rank(a) - rank(b)));
}

/** Fields in the order they appear on their steps (only the ones that can have a problem need listing). */
const SCREEN_ORDER = [
	"objective", "role", "propertyKind", "propertyType",
	"state", "lga", "area", "streetAddress",
	"offPlatformOwnerName", "offPlatformOwnerPhone",
	"floorAreaSqm", "floorLevel", "units", "fitOutState", "bedrooms", "bathrooms", "briefDescription",
	"plotSizeSqm", "titleDocType",
	"size", "yearBuilt", "furnishing", "floorNumber", "condition", "ownershipType",
	"photos",
	"salePrice", "rent", "rentPeriod", "minimumLease",
	"contactFirstName", "contactLastName", "contactEmail", "contactPhone",
];

/** The first field with a problem, in the step's order, or null. */
export const firstProblemField = (problems: Problems): string | null => Object.keys(problems)[0] ?? null;

/** True when the step has no problems (so Continue may move on). */
export function isStepValid(stepKey: string, data: ListPropertyData): boolean {
	return Object.keys(stepProblems(stepKey, data)).length === 0;
}
