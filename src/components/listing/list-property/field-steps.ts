import { propertyWizardSubmitSchema, type PropertyWizardSubmitInput } from "@/lib/validators/property";
import { listPropertyInitialData, type ListPropertyData, type ListingObjective } from "@/stores/listPropertyStore";
import type { WizardKind } from "./steps";

/**
 * Which wizard step owns each field the server validates.
 *
 * When the server refuses a listing it names the failing fields. This map turns a
 * field into the step where the person can fix it, so the form can take them there.
 * It is keyed by every field of `propertyWizardSubmitSchema` (a missing key is a
 * compile error, and a test walks the schema's shape too), so a field added later
 * can't silently fall back to a bare "Invalid request".
 *
 * A field's step can differ by kind and objective, and a step that isn't part of
 * the current flow is never a target: those fields return null and the caller shows
 * the message in a toast instead.
 */
export type FieldContext = {
	kind: WizardKind;
	objective: ListingObjective | null;
	/** Step keys that exist in the current flow (and can be edited), in wizard order. */
	flowKeys: string[];
};

type StepOf = (ctx: FieldContext) => string | null;

const at = (step: string): StepOf => () => step;
const sellOnly = (step: string): StepOf => (ctx) => (ctx.objective === "SELL" ? step : null);
// Property info shows bedrooms/bathrooms for houses only, and four extra questions for commercial only.
const notCommercial = (step: string): StepOf => (ctx) => (ctx.kind === "COMMERCIAL" ? null : step);
const commercialOnly = (step: string): StepOf => (ctx) => (ctx.kind === "COMMERCIAL" ? step : null);
const notSell = (step: string): StepOf => (ctx) => (ctx.objective === "SELL" ? null : step);
// Commercial listings mirror floor area/level into size/floor number in Property info
// and hide the Description-step copies, so their errors belong on Property info.
const sizeLike: StepOf = (ctx) => (ctx.kind === "COMMERCIAL" ? "property-info" : "description");

const FIELD_STEP: Record<keyof PropertyWizardSubmitInput, StepOf> = {
	objective: at("overview"),
	role: at("overview"),
	propertyKind: at("kind"),
	propertyType: at("kind"),

	state: at("location"),
	zipCode: at("location"),
	streetAddress: at("location"),
	unit: at("location"),
	city: at("location"),
	area: at("location"),
	lga: at("location"),
	latitude: at("location"),
	longitude: at("location"),
	geocodeAccuracy: at("location"),
	fullAddressVisible: at("location"),

	bedrooms: notCommercial("property-info"),
	bathrooms: notCommercial("property-info"),
	briefDescription: (ctx) => (ctx.kind === "LAND" ? "land-details" : "property-info"),

	size: sizeLike,
	floorNumber: sizeLike,
	yearBuilt: at("description"),
	furnishing: at("description"),
	condition: at("description"),
	ownershipType: at("description"),

	amenities: at("amenities"),
	customAmenities: at("amenities"),
	parkingSpaces: at("amenities"),
	powerBackup: at("amenities"),
	waterSource: at("amenities"),
	internetReady: at("amenities"),

	floorAreaSqm: commercialOnly("property-info"),
	floorLevel: commercialOnly("property-info"),
	units: commercialOnly("property-info"),
	fitOutState: commercialOnly("property-info"),

	plotSizeSqm: at("land-details"),
	titleDocType: at("land-details"),
	surveyAvailable: at("land-details"),
	topography: at("land-details"),
	accessRoad: at("land-details"),
	fencing: at("land-details"),

	photos: at("photos"),

	// Rent/lease pricing fields are only on screen when the objective isn't SELL.
	rent: notSell("pricing"),
	rentPeriod: notSell("pricing"),
	minimumLease: notSell("pricing"),
	agencyFee: notSell("pricing"),
	legalFee: notSell("pricing"),
	cautionDeposit: notSell("pricing"),
	serviceCharge: notSell("pricing"),
	serviceChargeIncludes: notSell("pricing"),
	availability: notSell("pricing"),
	availableFrom: notSell("pricing"),
	salePrice: sellOnly("pricing"),
	negotiable: at("pricing"),
	titleDocuments: sellOnly("pricing"),

	leaseTerms: at("lease-terms"),

	contactFirstName: at("contact"),
	contactLastName: at("contact"),
	contactEmail: at("contact"),
	contactPhone: at("contact"),

	offPlatformOwnerName: at("owner"),
	offPlatformOwnerPhone: at("owner"),
};

/** The step that owns `field` in this flow, or null when it has none (unknown field, or its step isn't in the flow). */
export function stepForField(field: string, ctx: FieldContext): string | null {
	const of = (FIELD_STEP as Record<string, StepOf | undefined>)[field];
	const step = of?.(ctx) ?? null;
	return step && ctx.flowKeys.includes(step) ? step : null;
}

/** Every field the map knows, for the coverage test. */
export const MAPPED_FIELDS = Object.keys(FIELD_STEP);

// The edit page PATCHes the update schema, whose keys differ from the wizard's in four places.
const UPDATE_KEY_TO_FIELD: Record<string, string> = {
	description: "briefDescription",
	availabilityStatus: "availability",
	agencyFeeMode: "agencyFee",
	legalFeeMode: "legalFee",
};

export type ResolvedErrors = {
	/** Message per field, keyed by the wizard's field name: shown under the field. */
	messages: Record<string, string>;
	/** Step to open: the owner of the first failing field in wizard order, or null when none is known. */
	step: string | null;
	/** The first failing field that has a place on screen, to scroll to. */
	firstField: string | null;
	/** Text for the toast: the first reason, plus "and N more". */
	toast: string;
};

/**
 * Turn the server's `fieldErrors` into where to go and what to show.
 * First = first in wizard order (step order, then the schema's own field order),
 * not alphabetical. Fields without a step in this flow still count and still get a
 * message, but never move the person.
 */
export function resolveFieldErrors(
	fieldErrors: Record<string, string[]>,
	ctx: FieldContext,
	source: "create" | "edit" = "create"
): ResolvedErrors {
	const schemaOrder = Object.keys(propertyWizardSubmitSchema.shape);
	const entries = Object.entries(fieldErrors)
		.filter(([, msgs]) => msgs.length > 0)
		.map(([key, msgs]) => {
			const field = source === "edit" ? UPDATE_KEY_TO_FIELD[key] ?? key : key;
			return { field, message: msgs[0], step: stepForField(field, ctx) };
		});

	const rank = (e: { field: string; step: string | null }) => [
		e.step === null ? Number.MAX_SAFE_INTEGER : ctx.flowKeys.indexOf(e.step),
		schemaOrder.indexOf(e.field) === -1 ? Number.MAX_SAFE_INTEGER : schemaOrder.indexOf(e.field),
	];
	entries.sort((a, b) => {
		const [as, af] = rank(a);
		const [bs, bf] = rank(b);
		return as - bs || af - bf;
	});

	const messages: Record<string, string> = {};
	for (const e of entries) if (e.step) messages[e.field] = e.message;

	const first = entries[0];
	const extra = entries.length - 1;
	return {
		messages,
		step: first?.step ?? null,
		firstField: first?.step ? first.field : null,
		toast: !first ? "Some details need fixing — check the form and try again" : extra > 0 ? `${first.message} and ${extra} more` : first.message,
	};
}

/**
 * The draft as it should be sent: every field the chosen kind and objective hide
 * is put back to its empty default, so a value left over from before the kind or
 * objective was changed (a year built on what is now a land listing) can't be
 * refused by the server when there is nothing on screen to fix. The draft the
 * person sees is not touched: this returns a copy.
 *
 * A field is hidden when it has no step in the current flow (`stepForField` is null).
 * Only fields the server validates are considered; the rest of the draft passes through.
 */
export function dropHiddenFields<T extends ListPropertyData>(data: T, ctx: FieldContext): T {
	const out: Record<string, unknown> = { ...(data as unknown as Record<string, unknown>) };
	const defaults = listPropertyInitialData as unknown as Record<string, unknown>;
	for (const field of MAPPED_FIELDS) {
		if (field in out && stepForField(field, ctx) === null) out[field] = defaults[field];
	}
	return out as T;
}
