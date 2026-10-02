import type { ZodErrorMap, ZodIssueOptionalMessage } from "zod";

/**
 * Plain-language messages for the listing validators.
 *
 * Zod's defaults ("Expected integer, received float", "Invalid input") mean
 * nothing to a lister. `plainErrorMap` turns every issue into one short sentence
 * that names the field, and the listing routes parse with it, so even a rule
 * added later gets a readable message. It only changes the words: what each rule
 * accepts or rejects is unchanged. A rule with its own message (for example the
 * price ceiling) keeps it, because explicit schema messages win over an error map.
 */

/** Human names for every key the wizard submit and listing update schemas accept. */
export const FIELD_LABELS: Record<string, string> = {
	// Overview / kind
	objective: "What you're listing",
	role: "Your role",
	propertyKind: "Property kind",
	propertyType: "Property type",
	listingType: "Listing type",
	// Location
	state: "State",
	zipCode: "Zip code",
	streetAddress: "Street address",
	unit: "Unit",
	city: "City",
	area: "Area",
	lga: "LGA",
	landmark: "Landmark",
	latitude: "Map location",
	longitude: "Map location",
	geocodeAccuracy: "Map accuracy",
	fullAddressVisible: "Address visibility",
	// Property info / description
	bedrooms: "Bedrooms",
	bathrooms: "Bathrooms",
	briefDescription: "Description",
	description: "Description",
	size: "Property size",
	yearBuilt: "Year built",
	furnishing: "Furnishing",
	floorNumber: "Floor",
	condition: "Condition",
	ownershipType: "Ownership type",
	// Amenities / facts
	amenities: "Amenities",
	customAmenities: "Custom amenities",
	parkingSpaces: "Parking spaces",
	powerBackup: "Power backup",
	waterSource: "Water source",
	internetReady: "Internet",
	// Commercial
	floorAreaSqm: "Floor area",
	floorLevel: "Floor level",
	units: "Number of units",
	fitOutState: "Fit-out state",
	// Land
	plotSizeSqm: "Plot size",
	titleDocType: "Title document",
	surveyAvailable: "Survey",
	topography: "Topography",
	accessRoad: "Access road",
	fencing: "Fencing",
	// Photos
	photos: "Photos",
	// Pricing
	rent: "Price",
	rentPeriod: "Rent period",
	minimumLease: "Minimum lease",
	agencyFee: "Agency fee",
	agencyFeeMode: "Agency fee type",
	legalFee: "Legal fee",
	legalFeeMode: "Legal fee type",
	cautionDeposit: "Caution deposit",
	serviceCharge: "Service charge",
	serviceChargeIncludes: "Service charge details",
	availability: "Availability",
	availabilityStatus: "Availability",
	availableFrom: "Available-from date",
	salePrice: "Sale price",
	negotiable: "Negotiable",
	titleDocuments: "Title documents",
	leaseTerms: "Lease terms",
	// Contact
	contactFirstName: "First name",
	contactLastName: "Last name",
	contactEmail: "Contact email",
	contactPhone: "Contact phone",
	offPlatformOwnerName: "Owner name",
	offPlatformOwnerPhone: "Owner phone",
};

const PRICE_FIELDS = new Set(["rent", "salePrice", "agencyFee", "legalFee", "cautionDeposit", "serviceCharge"]);

export const labelFor = (path: ReadonlyArray<string | number>): string => {
	const key = path.find((p): p is string => typeof p === "string");
	return (key && FIELD_LABELS[key]) || "This field";
};

const lower = (s: string) => (s === "This field" ? s : s.charAt(0).toLowerCase() + s.slice(1));
const num = (n: number) => n.toLocaleString("en-NG");

export const plainErrorMap: ZodErrorMap = (issue: ZodIssueOptionalMessage, ctx) => {
	const key = issue.path.find((p): p is string => typeof p === "string");
	const label = labelFor(issue.path);
	const isPrice = !!key && PRICE_FIELDS.has(key);

	switch (issue.code) {
		case "invalid_type": {
			if (issue.received === "undefined" || issue.received === "null") return { message: `${label} is required` };
			if (issue.expected === "integer") return { message: `${label} must be a whole number` };
			if (issue.expected === "number") return { message: `${label} must be a number` };
			if (issue.expected === "string") return { message: `${label} must be text` };
			if (issue.expected === "boolean") return { message: `${label} must be yes or no` };
			return { message: `${label} isn't in the right format` };
		}
		case "too_small": {
			if (issue.type === "number") {
				if (!issue.inclusive) return { message: `${label} must be more than zero` };
				if (issue.minimum === 0) return { message: `${label} can't be negative` };
				return { message: `${label} must be at least ${isPrice ? "₦" : ""}${num(Number(issue.minimum))}` };
			}
			if (issue.type === "array") {
				if (key === "photos") return { message: "Add at least one photo" };
				return { message: `Add at least ${issue.minimum} to ${lower(label)}` };
			}
			return { message: `${label} is required` };
		}
		case "too_big": {
			if (issue.type === "number") {
				return { message: `${label} can't be more than ${isPrice ? "₦" : ""}${num(Number(issue.maximum))}` };
			}
			if (issue.type === "array") return { message: `${label}: ${issue.maximum} at most` };
			return { message: `${label} is too long (${issue.maximum} characters at most)` };
		}
		case "invalid_string": {
			if (issue.validation === "email") return { message: `Enter a valid ${lower(label)}` };
			if (issue.validation === "datetime") return { message: `Enter a valid ${lower(label)}` };
			return { message: `${label} isn't in the right format` };
		}
		case "invalid_enum_value":
		case "invalid_literal":
			return { message: `Choose a valid option for ${lower(label)}` };
		case "invalid_union":
			return { message: key === "contactEmail" ? "Enter a valid contact email" : `${label} isn't valid` };
		case "custom":
			return { message: ctx.defaultError === "Invalid input" ? `${label} isn't valid` : ctx.defaultError };
		default:
			return { message: `${label} isn't valid` };
	}
};
