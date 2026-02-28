import { z } from "zod";

export const propertyCreateSchema = z.object({
	title: z
		.string()
		.min(10, "Title must be at least 10 characters")
		.max(100, "Title must be less than 100 characters"),
	propertyType: z.enum([
		"FLAT",
		"HOUSE",
		"DUPLEX",
		"SELF_CONTAIN",
		"BUNGALOW",
		"COMMERCIAL",
		"LAND",
	]),
	bedrooms: z.number().min(0).max(20),
	bathrooms: z.number().min(0).max(20),
	description: z.string().max(2000).optional(),
	size: z.number().positive().optional(),
	yearBuilt: z.number().min(1950).max(new Date().getFullYear()).optional(),
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

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyFilterInput = z.infer<typeof propertyFilterSchema>;
