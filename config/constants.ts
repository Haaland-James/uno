// Property Types (legacy flat list — kept for back-compat with existing UIs)
export const PROPERTY_TYPES = [
	{ value: "FLAT", label: "Flat" },
	{ value: "HOUSE", label: "House" },
	{ value: "DUPLEX", label: "Duplex" },
	{ value: "SELF_CONTAIN", label: "Self Contain" },
	{ value: "BUNGALOW", label: "Bungalow" },
	{ value: "COMMERCIAL", label: "Commercial" },
	{ value: "LAND", label: "Land" },
] as const;

// Property Kinds — top-level branching for the listing wizard.
export const PROPERTY_KINDS = [
	{ value: "RESIDENTIAL", label: "Residential", description: "Homes for living — flats, houses, duplexes" },
	{ value: "COMMERCIAL", label: "Commercial", description: "Offices, shops, warehouses, event centres" },
	{ value: "LAND", label: "Land", description: "Plots and undeveloped parcels" },
] as const;

export type PropertyKind = (typeof PROPERTY_KINDS)[number]["value"];

// Property Types grouped by Kind. The wizard uses this to filter the Type select
// based on the chosen Kind.
export const PROPERTY_TYPES_BY_KIND: Record<
	PropertyKind,
	ReadonlyArray<{ value: string; label: string }>
> = {
	RESIDENTIAL: [
		{ value: "BUNGALOW", label: "Bungalow" },
		{ value: "DUPLEX", label: "Duplex" },
		{ value: "FLAT", label: "Flat / Apartment" },
		{ value: "SELF_CONTAIN", label: "Self Contain" },
		{ value: "MINI_FLAT", label: "Mini Flat" },
		{ value: "STUDIO", label: "Studio" },
		{ value: "TERRACE", label: "Terrace" },
		{ value: "DETACHED", label: "Detached House" },
		{ value: "SEMI_DETACHED", label: "Semi-Detached" },
		{ value: "PENTHOUSE", label: "Penthouse" },
		{ value: "SHARED_ROOM", label: "Shared Room" },
	],
	COMMERCIAL: [
		{ value: "OFFICE", label: "Office Space" },
		{ value: "SHOP", label: "Shop / Retail" },
		{ value: "WAREHOUSE", label: "Warehouse" },
		{ value: "COWORKING", label: "Co-working Desk" },
		{ value: "EVENT_CENTRE", label: "Event Centre" },
		{ value: "HOTEL_SHORTLET", label: "Hotel / Short-let" },
		{ value: "PLAZA_UNIT", label: "Plaza Unit" },
	],
	LAND: [
		{ value: "RESIDENTIAL_PLOT", label: "Residential Plot" },
		{ value: "COMMERCIAL_PLOT", label: "Commercial Plot" },
		{ value: "AGRICULTURAL_LAND", label: "Agricultural Land" },
		{ value: "MIXED_USE_LAND", label: "Mixed-Use Land" },
	],
};

// Amenities grouped by category, scoped per Kind. Used by AmenitiesStep to
// render only the amenities that make sense for the chosen Kind.
export const AMENITIES_BY_KIND: Record<
	PropertyKind,
	ReadonlyArray<{ group: string; items: ReadonlyArray<string> }>
> = {
	RESIDENTIAL: [
		{
			group: "Indoor",
			items: [
				"Air Conditioning",
				"Built-in Wardrobes",
				"Kitchen Cabinets",
				"Tiled Floors",
				"POP Ceiling",
				"En-suite Bathrooms",
				"Walk-in Closet",
				"Smart Home",
			],
		},
		{
			group: "Outdoor",
			items: ["Balcony", "Garden", "Swimming Pool", "Boys Quarter (BQ)", "Patio"],
		},
		{
			group: "Security",
			items: ["Fenced", "Gated Estate", "CCTV", "Security Guard", "Burglar Bars"],
		},
		{
			group: "Building",
			items: ["Lift / Elevator", "Gym", "Children's Play Area", "Common Lounge"],
		},
		{
			group: "Utilities",
			items: ["Borehole", "Treated Water", "Prepaid Meter", "Water Heater"],
		},
	],
	COMMERCIAL: [
		{
			group: "Building",
			items: ["Lift / Elevator", "Reception", "Conference Room", "Kitchenette"],
		},
		{
			group: "Outdoor / Access",
			items: ["Loading Bay", "Dedicated Parking", "Disabled Access", "Drive-in Access"],
		},
		{
			group: "Security",
			items: ["24/7 Security", "CCTV", "Access Control", "Fire Suppression"],
		},
		{
			group: "Utilities",
			items: ["3-Phase Power", "Backup Generator", "Air Conditioning", "Borehole"],
		},
	],
	LAND: [
		{
			group: "Site",
			items: [
				"Cleared / Sand-filled",
				"Dry Land",
				"Fenced",
				"Gated Community",
				"Survey Plan Available",
			],
		},
		{
			group: "Utilities Nearby",
			items: ["Mains Electricity", "Mains Water", "Tarred Access Road"],
		},
	],
};

export const POWER_BACKUP_OPTIONS = [
	{ value: "NONE", label: "None" },
	{ value: "GENERATOR", label: "Generator" },
	{ value: "INVERTER", label: "Inverter" },
	{ value: "SOLAR", label: "Solar" },
] as const;

export const WATER_SOURCE_OPTIONS = [
	{ value: "BOREHOLE", label: "Borehole" },
	{ value: "MAINS", label: "Public Mains" },
	{ value: "TANKER", label: "Tanker Supply" },
] as const;

/** Reverse lookup: given a PropertyType value, which Kind does it belong to? */
export function getKindForPropertyType(type: string): PropertyKind | null {
	for (const kind of Object.keys(PROPERTY_TYPES_BY_KIND) as PropertyKind[]) {
		if (PROPERTY_TYPES_BY_KIND[kind].some((t) => t.value === type)) return kind;
	}
	// Legacy fallbacks for old enum values not in the by-kind map
	if (type === "HOUSE") return "RESIDENTIAL";
	if (type === "COMMERCIAL") return "COMMERCIAL";
	if (type === "LAND") return "LAND";
	return null;
}

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

// LGAs per state. Seeded for the states we currently surface; fall through to an
// empty list for everything else (the wizard then lets the user type freely).
export const LGAS_BY_STATE: Record<string, ReadonlyArray<string>> = {
	"Akwa Ibom": [
		"Uyo", "Ikot Ekpene", "Eket", "Oron", "Abak", "Itu", "Nsit Ibom",
		"Nsit Ubium", "Uruan", "Ibesikpo Asutan", "Etinan", "Mbo", "Onna",
	],
	"Lagos": [
		"Eti-Osa (Lekki/VI/Ikoyi)", "Ikeja", "Surulere", "Lagos Island",
		"Lagos Mainland", "Yaba", "Apapa", "Ajeromi-Ifelodun", "Mushin",
		"Oshodi-Isolo", "Alimosho", "Ikorodu", "Agege", "Amuwo Odofin",
		"Kosofe", "Ojo", "Ifako-Ijaiye", "Epe", "Ibeju-Lekki", "Badagry",
	],
	"Abuja (FCT)": [
		"Abuja Municipal (AMAC)", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Abaji",
	],
	"Rivers": [
		"Port Harcourt", "Obio-Akpor", "Eleme", "Okrika", "Ikwerre", "Oyigbo",
		"Tai", "Gokana", "Khana", "Bonny",
	],
	"Cross River": [
		"Calabar Municipal", "Calabar South", "Akpabuyo", "Odukpani", "Akamkpa",
		"Ikom", "Obudu", "Ogoja",
	],
	"Edo": ["Oredo", "Egor", "Ikpoba-Okha", "Ovia North-East", "Ovia South-West", "Uhunmwonde"],
	"Delta": ["Warri South", "Warri North", "Uvwie", "Udu", "Sapele", "Oshimili South", "Asaba"],
	"Oyo": [
		"Ibadan North", "Ibadan South-West", "Ibadan North-East", "Ibadan South-East",
		"Ibadan North-West", "Egbeda", "Akinyele", "Ona Ara", "Lagelu", "Oluyole",
	],
	"Kano": ["Kano Municipal", "Nassarawa", "Tarauni", "Fagge", "Dala", "Gwale", "Ungogo"],
	"Enugu": ["Enugu East", "Enugu North", "Enugu South", "Nsukka", "Udi", "Nkanu West"],
};

// Known areas/neighbourhoods per (state, lga). Powers AreaCombobox typeahead.
// Seed liberally where we have data; AreaCombobox lets the user add a new area
// inline if no match is found.
export const AREAS_BY_LGA: Record<string, ReadonlyArray<string>> = {
	"Akwa Ibom|Uyo": [
		"Ewet Housing", "Shelter Afrique", "Independence Layout", "Udo Udoma Avenue",
		"Ikot Ekpene Road", "Aka Road", "Nwaniba Road", "Oron Road", "IBB Way",
		"Ikpa Road", "Abak Road", "Four Lanes", "Ekom Iman", "Mbierebe", "Use Offot",
		"Uruan", "Itam", "Idoro Road",
	],
	"Lagos|Eti-Osa (Lekki/VI/Ikoyi)": [
		"Lekki Phase 1", "Lekki Phase 2", "Ikate", "Chevron", "Agungi", "Ikoyi",
		"Victoria Island", "Ajah", "Sangotedo", "Osapa London",
	],
	"Lagos|Ikeja": [
		"Ikeja GRA", "Allen Avenue", "Opebi", "Oregun", "Magodo", "Maryland",
	],
	"Lagos|Surulere": ["Adeniran Ogunsanya", "Bode Thomas", "Aguda"],
	"Lagos|Yaba": ["Akoka", "Sabo", "Onike", "Iwaya"],
	"Abuja (FCT)|Abuja Municipal (AMAC)": [
		"Maitama", "Asokoro", "Wuse 2", "Wuse Zone 1-7", "Garki Area 11",
		"Garki Area 1-3", "Jabi", "Utako", "Gudu", "Mabushi", "Katampe",
	],
	"Rivers|Port Harcourt": [
		"GRA Phase 1", "GRA Phase 2", "GRA Phase 3", "D-Line", "Mile 1", "Mile 2",
		"Diobu", "Old Government Reservation",
	],
	"Cross River|Calabar Municipal": ["State Housing", "Highway", "Atimbo", "Marian"],
	"Edo|Oredo": ["GRA", "New Benin", "Ugbowo", "Ekenwan"],
	"Delta|Asaba": ["Summit Road", "Okpanam Road", "Nnebisi Road", "DBS Road"],
	"Oyo|Ibadan North": ["Bodija", "Agodi", "U.I. (University of Ibadan)", "Sango"],
	"Kano|Kano Municipal": ["Sabon Gari", "Bompai", "Kabuga", "Hotoro"],
	"Enugu|Enugu North": ["Independence Layout", "GRA", "New Haven"],
};

/** Look up areas for a state+LGA pair. Returns [] if none seeded. */
export function getAreasForLga(state: string, lga: string): ReadonlyArray<string> {
	if (!state || !lga) return [];
	return AREAS_BY_LGA[`${state}|${lga}`] ?? [];
}

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
