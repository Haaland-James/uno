export type PropertyType =
	// Legacy
	| "FLAT"
	| "HOUSE"
	| "DUPLEX"
	| "SELF_CONTAIN"
	| "BUNGALOW"
	| "COMMERCIAL"
	| "LAND"
	// Residential
	| "TERRACE"
	| "DETACHED"
	| "SEMI_DETACHED"
	| "PENTHOUSE"
	| "STUDIO"
	| "MINI_FLAT"
	| "SHARED_ROOM"
	// Commercial
	| "OFFICE"
	| "SHOP"
	| "WAREHOUSE"
	| "COWORKING"
	| "EVENT_CENTRE"
	| "HOTEL_SHORTLET"
	| "PLAZA_UNIT"
	// Land
	| "RESIDENTIAL_PLOT"
	| "COMMERCIAL_PLOT"
	| "AGRICULTURAL_LAND"
	| "MIXED_USE_LAND";

export type PropertyKind = "RESIDENTIAL" | "COMMERCIAL" | "LAND";

export type Furnishing = "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED";

export type RentPeriod = "MONTH" | "YEAR";

export type ListingType = "RENT" | "LEASE" | "SALE";

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
	// Discriminator — "property" for real listings, "draft" for in-progress wizard rows.
	// Drives My Listings action routing (drafts use /api/me/drafts/[id]).
	kind?: "property" | "draft";
	id: string;
	title: string;
	propertyType: PropertyType;
	// API always returns listingType; older mock fixtures omit it (optional for back-compat)
	listingType?: ListingType;
	bedrooms: number;
	bathrooms: number;
	sizeSqm?: number | null;
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
	latitude?: number | null;
	longitude?: number | null;
	// True when the lister chose to hide their exact address. Coords on this DTO
	// are jittered (~100m) so the UI should render a privacy circle around them.
	addressPrivate?: boolean;
	// Landlord-side fields (optional; populated for "My Listings" view)
	status?: PropertyStatus;
	views?: number;
	inquiryCount?: number;
	savedCount?: number;
	streetAddress?: string;
	// True when this listing was created by an in-house UNO agent on behalf
	// of an off-platform owner. Drives the "Listed by UNO" badge on cards.
	listedByAgent?: boolean;
	// Promoted listing — toggled by admin. Drives the "Featured" badge on cards.
	isFeatured?: boolean;
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
		priceLabel: string;
		legalFeePercent: number;
		agentFeePercent: number;
		totalPackage: string;
		additional: { label: string; amount: number; period: string }[];
		additionalNote: string;
	};
	additionalInfo: { label: string; value: string }[];
	features: string[];
	listedBy: { name: string; company: string };
	// When `listedByAgent` is true on the parent, `listedBy.name` is set to
	// "UNO" institutionally and `agent` carries the field agent's identity
	// so the detail page can reveal them (with a link to /agents/[slug])
	// without losing the UNO-first trust framing.
	agent?: {
		name: string;
		slug: string | null;
		photo: string | null;
		bio: string | null;
	} | null;
	listingUpdated: string;
	unoChecked: string;
	landlordId: string;
	contact: {
		hasWhatsApp: boolean;
		hasPhone: boolean;
		hasEmail: boolean;
	};
}

/**
 * Minimal pin payload returned by /api/properties/map for cluster rendering.
 * No photos, no description — just enough to draw a price pill on the map.
 * Coords are already jittered server-side when `addressPrivate` is true.
 */
export interface MapPin {
	id: string;
	lng: number;
	lat: number;
	rent: number;
	currency: string;
	addressPrivate: boolean;
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
