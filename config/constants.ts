// Property Types
export const PROPERTY_TYPES = [
	{ value: "FLAT", label: "Flat" },
	{ value: "HOUSE", label: "House" },
	{ value: "DUPLEX", label: "Duplex" },
	{ value: "SELF_CONTAIN", label: "Self Contain" },
	{ value: "BUNGALOW", label: "Bungalow" },
	{ value: "COMMERCIAL", label: "Commercial" },
	{ value: "LAND", label: "Land" },
] as const;

// Furnishing Options
export const FURNISHING_OPTIONS = [
	{ value: "UNFURNISHED", label: "Unfurnished" },
	{ value: "SEMI_FURNISHED", label: "Semi-Furnished" },
	{ value: "FULLY_FURNISHED", label: "Fully Furnished" },
] as const;

// Rent Periods
export const RENT_PERIODS = [
	{ value: "YEAR", label: "per year" },
	{ value: "MONTH", label: "per month" },
] as const;

// Standard Amenities (Nigerian market)
export const AMENITIES = [
	"Water Supply",
	"Electricity (NEPA/PHCN)",
	"Generator",
	"Parking Space",
	"Security/Gate",
	"Fence/Wall",
	"Borehole",
	"Water Heater",
	"Air Conditioning",
	"Tiled Floor",
	"POP Ceiling",
	"Wardrobe",
	"Kitchen Cabinet",
	"Balcony",
	"Store Room",
	"Boys Quarter (BQ)",
	"Swimming Pool",
	"Gym",
	"CCTV",
	"Solar Panel",
	"Prepaid Meter",
	"Ensuite",
	"Walk-in Closet",
	"Smart Home",
] as const;

// Bedroom Options
export const BEDROOM_OPTIONS = [
	{ value: "1", label: "1 Bedroom" },
	{ value: "2", label: "2 Bedrooms" },
	{ value: "3", label: "3 Bedrooms" },
	{ value: "4", label: "4 Bedrooms" },
	{ value: "5", label: "5+ Bedrooms" },
] as const;

// Bathroom Options
export const BATHROOM_OPTIONS = [
	{ value: "1", label: "1 Bathroom" },
	{ value: "2", label: "2 Bathrooms" },
	{ value: "3", label: "3 Bathrooms" },
	{ value: "4", label: "4+ Bathrooms" },
] as const;

// Price Ranges (NGN, yearly)
export const PRICE_RANGES = [
	{ min: 0, max: 150000, label: "Under ₦150,000" },
	{ min: 150000, max: 300000, label: "₦150,000 - ₦300,000" },
	{ min: 300000, max: 500000, label: "₦300,000 - ₦500,000" },
	{ min: 500000, max: 800000, label: "₦500,000 - ₦800,000" },
	{ min: 800000, max: 1200000, label: "₦800,000 - ₦1.2M" },
	{ min: 1200000, max: 2000000, label: "₦1.2M - ₦2M" },
	{ min: 2000000, max: 5000000, label: "₦2M - ₦5M" },
	{ min: 5000000, max: Infinity, label: "Above ₦5M" },
] as const;

// Cities and Areas (starting with Uyo)
export const LOCATIONS = {
	"Uyo": [
		"Ewet Housing",
		"Shelter Afrique",
		"Independence Layout",
		"Udo Udoma Avenue",
		"Ikot Ekpene Road",
		"Aka Road",
		"Nwaniba Road",
		"Oron Road",
		"IBB Way",
		"Ikpa Road",
		"Abak Road",
		"Four Lanes",
		"Ekom Iman",
		"Mbierebe",
		"Use Offot",
		"Uruan",
		"Itam",
		"Idoro Road",
	],
} as const;

// Nigerian States (for future expansion)
export const NIGERIAN_STATES = [
	"Akwa Ibom",
	"Lagos",
	"Abuja (FCT)",
	"Rivers",
	"Cross River",
	"Edo",
	"Delta",
	"Oyo",
	"Kano",
	"Enugu",
] as const;

// Verification Levels
export const VERIFICATION_LEVELS = {
	BASIC: { label: "Basic", color: "text-paused" },
	ADVANCED: { label: "Verified", color: "text-verified" },
	PREMIUM: { label: "Premium Verified", color: "text-verified" },
} as const;

// Contact Methods
export const CONTACT_METHODS = [
	{ value: "WHATSAPP", label: "WhatsApp", icon: "MessageCircle" },
	{ value: "PHONE", label: "Phone Call", icon: "Phone" },
	{ value: "EMAIL", label: "Email", icon: "Mail" },
] as const;

// Currency
export const CURRENCY = {
	code: "NGN",
	symbol: "₦",
	locale: "en-NG",
} as const;

// Pagination
export const PAGE_SIZE = 20;

// Mobile Nav Items
export const MOBILE_NAV_ITEMS = [
	{ href: "/feed", label: "Home", icon: "Home" },
	{ href: "/search", label: "Search", icon: "Search" },
	{ href: "/favourites", label: "Saved", icon: "Heart" },
	{ href: "/profile", label: "Profile", icon: "User" },
] as const;

// Landlord Sidebar Items
export const LANDLORD_NAV_ITEMS = [
	{ href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
	{ href: "/properties", label: "Properties", icon: "Building2" },
	{ href: "/properties/new", label: "Add Property", icon: "Plus" },
	{ href: "/contacts", label: "Messages", icon: "MessageSquare" },
	{ href: "/analytics", label: "Analytics", icon: "BarChart3" },
] as const;
