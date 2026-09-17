/**
 * Cookie consent state.
 *
 * Stored in a first-party cookie rather than localStorage so that server
 * components, middleware and (later) analytics bootstrapping can all read the
 * same value. localStorage would be invisible to the server and would force a
 * client round-trip before we could decide whether to load a tracker.
 *
 * Today the app sets only strictly-necessary cookies, so nothing is actually
 * gated on this yet. It exists so the plumbing is in place before analytics
 * arrives — at which point the only change needed is to call
 * hasAnalyticsConsent() before loading the script.
 */

export const CONSENT_COOKIE = "hf_cookie_consent";
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 12 months

export type ConsentChoice = "all" | "essential";

/**
 * Reads the stored choice, or null if the visitor hasn't chosen yet.
 *
 * Returns null rather than throwing in private windows, when site data is
 * blocked, during SSR, and in thumbnail/preview contexts — callers treat null
 * as "not yet decided", which is the safe default.
 */
export function readConsent(): ConsentChoice | null {
	if (typeof document === "undefined") return null;
	try {
		const match = document.cookie
			.split("; ")
			.find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
		if (!match) return null;
		const value = decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1));
		return value === "all" || value === "essential" ? value : null;
	} catch {
		return null;
	}
}

export function writeConsent(choice: ConsentChoice): void {
	if (typeof document === "undefined") return;
	try {
		const secure = window.location.protocol === "https:" ? "; Secure" : "";
		document.cookie =
			`${CONSENT_COOKIE}=${choice}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; ` +
			`Path=/; SameSite=Lax${secure}`;
	} catch {
		// Storage blocked. The banner will reappear next visit, which is the
		// correct failure mode — better than assuming consent we can't record.
	}
}

/** True only on an explicit opt-in. Absence of a choice is not consent. */
export function hasAnalyticsConsent(): boolean {
	return readConsent() === "all";
}
