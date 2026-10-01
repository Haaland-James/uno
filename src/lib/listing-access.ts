/**
 * Who may create a listing (POST /api/properties).
 *
 * Phase 1: on production and its standby, only UNO staff list: admins and
 * verified in-house agents (the same condition the /agent console gate uses).
 * Staging and dev stay open so anyone can test the listing flow.
 *
 * Phase 2 (self-serve listers) is a one-line change: make `canCreateListing`
 * return true, or drop the call in the route. Nothing else is stripped; the
 * route, validators and wizard are untouched (hide, don't strip).
 */
export type ListingUser = {
	role?: string | null;
	agentStatus?: string | null;
	agentEmployment?: string | null;
};

// Environments where the restriction is lifted. Anything else, including an
// unset or mistyped NEXT_PUBLIC_APP_ENV, counts as live: fail closed.
const OPEN_ENVS = new Set(["STAGING", "DEV"]);

export function isListingCreationOpen(appEnv: string | undefined): boolean {
	return OPEN_ENVS.has((appEnv ?? "").trim().toUpperCase());
}

export function isStaffLister(user: ListingUser): boolean {
	return user.role === "ADMIN" || (user.agentStatus === "VERIFIED" && user.agentEmployment === "IN_HOUSE");
}

export function canCreateListing(user: ListingUser, appEnv: string | undefined = process.env.NEXT_PUBLIC_APP_ENV): boolean {
	return isListingCreationOpen(appEnv) || isStaffLister(user);
}
