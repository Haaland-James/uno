export type PropertyType =
	| "FLAT"
	| "HOUSE"
	| "DUPLEX"
	| "SELF_CONTAIN"
	| "BUNGALOW"
	| "COMMERCIAL"
	| "LAND";

export type Furnishing = "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED";

export type RentPeriod = "MONTH" | "YEAR";

export type PropertyStatus = "AVAILABLE" | "PUBLISHED" | "UNPUBLISHED";

export type AvailabilityStatus =
	| "AVAILABLE_NOW"
	| "AVAILABLE_FROM"
	| "RENTED";

export type VerificationStatus = "IN_PROGRESS" | "PENDING" | "VERIFIED" | "REJECTED";

export interface PropertyPhoto {
	id: string;
	propertyId: string;
	url: string;
	isMain: boolean;
	order: number;
	createdAt: Date;
}

export interface Property {
	id: string;
	landlordId: string;
	title: string;
	propertyType: PropertyType;
	bedrooms: number;
	bathrooms: number;
	description?: string | null;
	size?: number | null;
	yearBuilt?: number | null;
	furnishing?: Furnishing | null;
	condition?: string | null;
	floorNumber?: string | null;
	amenities: string[];
	customAmenities: string[];
	photos: PropertyPhoto[];
	city: string;
	area: string;
	streetAddress?: string | null;
	landmark?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	fullAddressVisible: boolean;
	rent: number;
	rentPeriod: RentPeriod;
	currency: string;
	agencyFee?: number | null;
	cautionDeposit?: number | null;
	serviceCharge?: number | null;
	negotiable: boolean;
	status: PropertyStatus;
	availabilityStatus: AvailabilityStatus;
	availableFrom?: Date | null;
	minimumLease?: string | null;
	isRented: boolean;
	views: number;
	contactCount: number;
	savedCount: number;
	verificationStatus: VerificationStatus;
	verifiedAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

// Lightweight card display type
export interface PropertyCardData {
	id: string;
	title: string;
	propertyType: PropertyType;
	bedrooms: number;
	bathrooms: number;
	area: string;
	city: string;
	rent: number;
	rentPeriod: RentPeriod;
	currency: string;
	negotiable: boolean;
	amenities: string[];
	photos: { url: string; isMain: boolean }[];
	verificationStatus: VerificationStatus;
	availabilityStatus: AvailabilityStatus;
	isFavourited?: boolean;
	createdAt: Date;
	// Landlord-side fields (optional; populated for "My Listings" view)
	status?: PropertyStatus;
	views?: number;
	inquiryCount?: number;
	savedCount?: number;
	streetAddress?: string;
}

// Detailed property data for single-view page
export interface PropertyDetailData extends PropertyCardData {
	streetAddress?: string;
	description?: string;
	listingStatus: string;
	daysOnUno: number;
	views: number;
	favourites: number;
	fees: {
		annualRent: number;
		legalFeePercent: number;
		agentFeePercent: number;
		totalPackage: string;
		additional: { label: string; amount: number; period: string }[];
		additionalNote: string;
	};
	additionalInfo: { label: string; value: string }[];
	features: string[];
	listedBy: { name: string; company: string };
	listingUpdated: string;
	unoChecked: string;
}

// Search/filter types
export interface PropertyFilters {
	city?: string;
	area?: string;
	propertyType?: PropertyType[];
	minPrice?: number;
	maxPrice?: number;
	bedrooms?: number[];
	bathrooms?: number[];
	furnishing?: Furnishing[];
	amenities?: string[];
	verifiedOnly?: boolean;
	availableNow?: boolean;
	sortBy?: "price_asc" | "price_desc" | "newest" | "most_viewed";
}

// Property form data (for creation/editing)
export interface PropertyFormData {
	title: string;
	propertyType: PropertyType;
	bedrooms: number;
	bathrooms: number;
	description?: string;
	size?: number;
	yearBuilt?: number;
	furnishing?: Furnishing;
	condition?: string;
	floorNumber?: string;
	amenities: string[];
	customAmenities: string[];
	city: string;
	area: string;
	streetAddress?: string;
	landmark?: string;
	latitude?: number;
	longitude?: number;
	fullAddressVisible: boolean;
	rent: number;
	rentPeriod: RentPeriod;
	agencyFee?: number;
	cautionDeposit?: number;
	serviceCharge?: number;
	negotiable: boolean;
	availabilityStatus: AvailabilityStatus;
	availableFrom?: string;
	minimumLease?: string;
}
