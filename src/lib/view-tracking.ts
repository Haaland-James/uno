import { createHmac } from "node:crypto";

// en-CA formats as YYYY-MM-DD. Lagos has no DST, so a day is always UTC+1.
const lagosDate = new Intl.DateTimeFormat("en-CA", {
	timeZone: "Africa/Lagos",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

/** Calendar day in Africa/Lagos — the de-dup window for PropertyView. */
export function lagosDay(date: Date = new Date()): string {
	return lagosDate.format(date);
}

/**
 * Stable per-day identity for a viewer, used in PropertyView's unique key.
 *
 * Signed-in viewers are keyed by user id. Guests are keyed by an HMAC of
 * IP + User-Agent + day: cookieless (the Cookie Policy promises no analytics
 * cookie), rotates daily, and irreversible without the secret. Shared IPs
 * (mobile CGNAT) can under-count guests; that's the accepted trade-off.
 */
export function viewerKey(input: {
	userId?: string | null;
	ip: string;
	ua: string;
	day: string;
	secret: string;
}): string {
	if (input.userId) return `u:${input.userId}`;
	const digest = createHmac("sha256", input.secret)
		.update(`view|${input.ip}|${input.ua}|${input.day}`)
		.digest("hex");
	return `a:${digest}`;
}

const BOT_UA = /bot|crawl|spider|slurp|preview|headless|facebookexternalhit|whatsapp|lighthouse/i;

/** Crawlers and link-preview fetchers. Empty UA counts as a bot. */
export function isLikelyBot(ua: string | null | undefined): boolean {
	if (!ua) return true;
	return BOT_UA.test(ua);
}
