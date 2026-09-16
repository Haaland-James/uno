/**
 * Brand, contact, and legal identity — the single source of truth.
 *
 * The product is named Hoomefynda. The repo, package, database, enum values,
 * and route segments remain `uno`; only user-facing copy uses `name`.
 *
 * Every value marked TODO must be filled in before launch. They are
 * deliberately collected here so the pre-launch checklist is one file, and so
 * an unfilled value is conspicuous in the UI rather than a plausible-looking
 * fake that ships unnoticed.
 */
export const siteConfig = {
	name: "Hoomefynda",

	/** Registered CAC entity. Used in Terms/Privacy, not in product chrome. */
	legalName: "TODO: registered CAC entity name",
	rcNumber: "TODO: RC number",
	registeredAddress: "TODO: registered office address",

	description:
		"Making House Hunting Simple, Verified, and Transparent. Nigeria's trusted rental property platform.",

	url: "TODO: https://hoomefynda.com",
	ogImage: "TODO: https://hoomefynda.com/og.jpg",

	support: {
		email: "TODO: support@hoomefynda.com",
		/** Display form, e.g. "+234 800 000 0000". */
		phone: "TODO: +234 800 000 0000",
		/** Digits only, country code first — this is what wa.me expects. */
		whatsapp: "TODO: 2348000000000",
		hours: "Mon–Sat, 9AM–6PM WAT",
	},

	/**
	 * Full profile URLs, not handles. The Terms name these as our only official
	 * channels, so anything listed here is a claim we are making publicly.
	 */
	socials: {
		instagram: "TODO: https://instagram.com/…",
		whatsapp: "TODO: https://wa.me/…",
		facebook: "TODO: https://facebook.com/…",
		tiktok: "TODO: https://tiktok.com/@…",
		x: "TODO: https://x.com/…",
		linkedin: "TODO: https://linkedin.com/company/…",
	},

	legal: {
		/** Bump whenever the substance of any legal page changes. */
		lastUpdated: "2026-09-16",
		governingLaw: "Federal Republic of Nigeria",
		/** Supervisory authority users may complain to under the NDPA 2023. */
		regulator: "Nigeria Data Protection Commission (NDPC)",
		regulatorUrl: "https://ndpc.gov.ng",
	},

	creator: "TODO: registered CAC entity name",

	keywords: [
		"rental",
		"property",
		"Nigeria",
		"Uyo",
		"apartment",
		"house",
		"flat",
		"rent",
		"landlord",
		"tenant",
	],
};

export type SiteConfig = typeof siteConfig;
