/**
 * Periphery navigation links — the single source of truth.
 *
 * These hrefs used to be duplicated across Footer, SearchPageFooter,
 * GuestMobileDrawer and MobileDrawer. The copies drifted: the same page was
 * labelled "Terms & Conditions", "Terms" and "Terms of Use" in three places,
 * and every list pointed at pages that had never been built. Import from here
 * so that can't happen again.
 *
 * Rule: nothing goes in this file until the route exists.
 */

export interface NavLink {
	label: string;
	href: string;
}

export const LEGAL_LINKS: NavLink[] = [
	{ label: "Terms of Service", href: "/terms" },
	{ label: "Privacy Policy", href: "/privacy" },
	{ label: "Cookie Policy", href: "/cookies" },
];

export const SUPPORT_LINKS: NavLink[] = [{ label: "Contact us", href: "/contact" }];

/** Everything in the footer's "Find us" column, in display order. */
export const PERIPHERY_LINKS: NavLink[] = [...SUPPORT_LINKS, ...LEGAL_LINKS];

/** Compact row for search-page and drawer footers. */
export const COMPACT_LEGAL_LINKS: NavLink[] = [
	{ label: "Terms", href: "/terms" },
	{ label: "Privacy", href: "/privacy" },
	{ label: "Cookies", href: "/cookies" },
	{ label: "Contact", href: "/contact" },
];

export const LISTINGS_LINKS: NavLink[] = [
	{ label: "Rent", href: "/search?purpose=rent" },
	{ label: "Buy", href: "/search?purpose=buy" },
	{ label: "Commercialize", href: "/search?purpose=commercial" },
];
