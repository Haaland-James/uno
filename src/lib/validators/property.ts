import { z } from "zod";

const feeValueSchema = z.object({
	mode: z.enum(["FIXED", "PERCENT"]).default("FIXED"),
	value: z.number().min(0).nullable(),
});

export const propertyCreateSchema = z.object({
	title: z
		.string()
		.min(10, "Title must be at least 10 characters")
		.max(100, "Title must be less than 100 characters"),
	propertyType: z.enum([
		"FLAT", "HOUSE", "DUPLEX", "SELF_CONTAIN", "BUNGALOW", "COMMERCIAL", "LAND",
		"TERRACE", "DETACHED", "SEMI_DETACHED", "PENTHOUSE", "STUDIO", "MINI_FLAT", "SHARED_ROOM",
		"OFFICE", "SHOP", "WAREHOUSE", "COWORKING", "EVENT_CENTRE", "HOTEL_SHORTLET", "PLAZA_UNIT",
		"RESIDENTIAL_PLOT", "COMMERCIAL_PLOT", "AGRICULTURAL_LAND", "MIXED_USE_LAND",
	]),
	bedrooms: z.number().min(0).max(20),
	bathrooms: z.number().min(0).max(20),
	description: z.string().max(2000).optional(),
	size: z.number().positive().optional(),
	yearBuilt: z.number().min(1950).refine((v) => v <= new Date().getFullYear(), { message: "Year cannot be in the future" }).optional(),
	furnishing: z.enum(["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"]).optional(),
	condition: z.string().max(100).optional(),
	floorNumber: z.string().max(20).optional(),
	amenities: z.array(z.string()).default([]),
	customAmenities: z.array(z.string().max(50)).max(10).default([]),
	city: z.string().min(1, "City is required"),
	area: z.string().min(1, "Area is required"),
	streetAddress: z.string().max(200).optional(),
	landmark: z.string().max(200).optional(),
	latitude: z.number().min(-90).max(90).optional(),
	longitude: z.number().min(-180).max(180).optional(),
	fullAddressVisible: z.boolean().default(false),
	rent: z
		.number()
		.min(10000, "Minimum rent is ₦10,000")
		.max(100000000, "Maximum rent is ₦100,000,000"),
	rentPeriod: z.enum(["MONTH", "YEAR"]).default("YEAR"),
	agencyFee: z.number().min(0).optional(),
	cautionDeposit: z.number().min(0).optional(),
	serviceCharge: z.number().min(0).optional(),
	negotiable: z.boolean().default(false),
	availabilityStatus: z
		.enum(["AVAILABLE_NOW", "AVAILABLE_FROM", "RENTED"])
		.default("AVAILABLE_NOW"),
	availableFrom: z.string().datetime().optional(),
	minimumLease: z.string().max(50).optional(),
});

export const propertyFilterSchema = z.object({
	city: z.string().optional(),
	area: z.string().optional(),
	propertyType: z
		.array(
			z.enum([
				"FLAT",
				"HOUSE",
				"DUPLEX",
				"SELF_CONTAIN",
				"BUNGALOW",
				"COMMERCIAL",
				"LAND",
			])
		)
		.optional(),
	minPrice: z.number().min(0).optional(),
	maxPrice: z.number().min(0).optional(),
	bedrooms: z.array(z.number().min(0).max(20)).optional(),
	bathrooms: z.array(z.number().min(0).max(20)).optional(),
	furnishing: z
		.array(z.enum(["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"]))
		.optional(),
	amenities: z.array(z.string()).optional(),
	verifiedOnly: z.boolean().optional(),
	availableNow: z.boolean().optional(),
	sortBy: z
		.enum(["price_asc", "price_desc", "newest", "most_viewed"])
		.optional(),
});

/**
 * Wizard submit shape — what the listing wizard's `handleSubmit` POSTs to /api/properties.
 * Mirrors `ListPropertyData` from src/stores/listPropertyStore.ts. Wider/looser than
 * propertyCreateSchema because it includes objective, contact fields, sale-flow fields,
 * and lets the server handle the mapping to Prisma's stricter Property shape.
 */
export const propertyWizardSubmitSchema = z.object({
	objective: z.enum(["SELL", "RENT", "LEASE"]),
	role: z.enum(["OWNER", "REPRESENTATIVE"]).nullable().optional(),
	propertyKind: z.enum(["RESIDENTIAL", "COMMERCIAL", "LAND"]).optional(),

	// Location
	state: z.string().min(1, "State is required"),
	zipCode: z.string().optional().default(""),
	streetAddress: z.string().optional().default(""),
	unit: z.string().optional().default(""),
	city: z.string().min(1, "City is required"),
	area: z.string().min(1, "Area is required"),
	lga: z.string().optional().default(""),
	latitude: z.number().min(-90).max(90).nullable().optional(),
	longitude: z.number().min(-180).max(180).nullable().optional(),
	geocodeAccuracy: z.string().optional().default(""),
	fullAddressVisible: z.boolean().optional().default(false),

	// Property info
	title: z.string().min(5, "Title must be at least 5 characters").max(120),
	propertyType: z.string().min(1, "Property type is required"),
	bedrooms: z.number().min(0).max(20).nullable(),
	bathrooms: z.number().min(0).max(20).nullable(),
	briefDescription: z.string().max(2000).optional().default(""),

	// Description
	size: z.number().positive().nullable().optional(),
	yearBuilt: z.number().min(1900).refine((v) => v <= new Date().getFullYear(), { message: "Year cannot be in the future" }).nullable().optional(),
	furnishing: z.string().optional().default(""),
	floorNumber: z.string().optional().default(""),
	condition: z.string().optional().default(""),
	ownershipType: z.string().optional().default(""),

	// Amenities
	amenities: z.array(z.string()).default([]),
	customAmenities: z.array(z.string().max(50)).max(10).default([]),

	// Structured facts
	parkingSpaces: z.number().int().min(0).nullable().optional(),
	powerBackup: z.string().optional().default(""),
	waterSource: z.string().optional().default(""),
	internetReady: z.boolean().optional().default(false),

	// Commercial-specific
	floorAreaSqm: z.number().int().positive().nullable().optional(),
	floorLevel: z.string().optional().default(""),
	units: z.number().int().positive().nullable().optional(),
	fitOutState: z.string().optional().default(""),

	// Land-specific
	plotSizeSqm: z.number().int().positive().nullable().optional(),
	titleDocType: z.string().optional().default(""),
	surveyAvailable: z.boolean().optional().default(false),
	topography: z.string().optional().default(""),
	accessRoad: z.string().optional().default(""),
	fencing: z.boolean().optional().default(false),

	// Photos — Cloudinary URLs already uploaded from the browser
	photos: z
		.array(
			z.object({
				url: z.string().url(),
				isMain: z.boolean().optional(),
			})
		)
		.min(1, "Add at least one photo"),

	// Pricing — rent/lease
	rent: z.number().positive().nullable().optional(),
	rentPeriod: z.enum(["MONTH", "YEAR"]).default("YEAR"),
	minimumLease: z.string().optional().default(""),
	agencyFee: feeValueSchema.optional(),
	legalFee: feeValueSchema.optional(),
	cautionDeposit: z.number().min(0).nullable().optional(),
	serviceCharge: z.number().min(0).nullable().optional(),
	serviceChargeIncludes: z.string().optional().default(""),
	availability: z.enum(["AVAILABLE_NOW", "AVAILABLE_FROM"]).default("AVAILABLE_NOW"),
	availableFrom: z.string().optional().default(""),

	// Pricing — sell
	salePrice: z.number().positive().nullable().optional(),
	negotiable: z.boolean().default(false),
	titleDocuments: z.string().optional().default(""),

	// Lease terms
	leaseTerms: z.string().optional().default(""),

	// Contact
	contactFirstName: z.string().optional().default(""),
	contactLastName: z.string().optional().default(""),
	contactEmail: z.string().email().optional().or(z.literal("")).default(""),
	contactPhone: z.string().optional().default(""),

	// Off-platform owner (in-house agents only). Optional in the schema —
	// the route handler enforces presence when the submitter is an
	// in-house agent and ignores them otherwise.
	offPlatformOwnerName: z.string().max(120).optional().default(""),
	offPlatformOwnerPhone: z.string().max(40).optional().default(""),
});

/**
 * Partial update — owner can edit anything in propertyCreateSchema, plus the
 * wider set of fields the edit-by-section UI exposes (photos, legal fee,
 * structured facts, kind-specific fields). All optional; only fields actually
 * sent get persisted.
 */
export const propertyUpdateSchema = propertyCreateSchema
	.omit({ availabilityStatus: true })
	.partial()
	.extend({
	state: z.string().max(120).optional(),
	lga: z.string().max(120).optional(),
	ownershipType: z.string().max(60).optional(),
	geocodeAccuracy: z.string().max(40).optional(),

	parkingSpaces: z.number().int().min(0).nullable().optional(),
	powerBackup: z.string().max(60).optional(),
	waterSource: z.string().max(60).optional(),
	internetReady: z.boolean().optional(),

	floorAreaSqm: z.number().int().positive().nullable().optional(),
	floorLevel: z.string().max(40).optional(),
	units: z.number().int().positive().nullable().optional(),
	fitOutState: z.string().max(60).optional(),

	plotSizeSqm: z.number().int().positive().nullable().optional(),
	titleDocType: z.string().max(60).optional(),
	surveyAvailable: z.boolean().optional(),
	topography: z.string().max(60).optional(),
	accessRoad: z.string().max(60).optional(),
	fencing: z.boolean().optional(),

	agencyFee: z.number().min(0).nullable().optional(),
	agencyFeeMode: z.enum(["FIXED", "PERCENT"]).optional(),
	legalFee: z.number().min(0).nullable().optional(),
	legalFeeMode: z.enum(["FIXED", "PERCENT"]).optional(),
	cautionDeposit: z.number().min(0).nullable().optional(),
	serviceCharge: z.number().min(0).nullable().optional(),

	availableFrom: z.string().nullable().optional(),

	// These fields come from the base create schema as `.optional()` (not nullable),
	// but the edit page clears them by sending `null`. Override to accept null here.
	description: z.string().max(2000).nullish(),
	size: z.number().positive().nullable().optional(),
	yearBuilt: z.number().min(1900).refine((v) => v <= new Date().getFullYear(), { message: "Year cannot be in the future" }).nullable().optional(),
	condition: z.string().max(100).nullish(),
	floorNumber: z.string().max(20).nullish(),
	streetAddress: z.string().max(200).nullish(),
	minimumLease: z.string().max(50).nullish(),

	photos: z
		.array(
			z.object({
				url: z.string().url(),
				isMain: z.boolean().optional(),
			})
		)
		.min(1, "Add at least one photo")
		.optional(),
});

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyFilterInput = z.infer<typeof propertyFilterSchema>;
export type PropertyWizardSubmitInput = z.infer<typeof propertyWizardSubmitSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;
