import { sendEmail, escapeHtml, renderShell, renderText, ctaButtons } from "./render";
import { formatNaira, formatRentPrice } from "@/lib/utils";
import { siteUrl } from "@/lib/site";

export interface MatchedListing {
	id: string;
	title: string;
	area: string;
	city: string;
	listingType: "RENT" | "LEASE" | "SALE";
	rent: number;
	rentPeriod: "MONTH" | "YEAR";
	/** Main photo, https only; omitted when the listing has none. */
	photoUrl?: string | null;
}

export interface MatchedSearchGroup {
	searchName: string;
	/** Everything new for this search, which can be more than `listings` (we show up to 5). */
	total: number;
	listings: MatchedListing[];
	/** Where "See all" goes: the search's own results page, as a path like /properties?... */
	resultsPath: string;
}

/** Sale prices have no period; rent and lease do. Prices can exceed ₦2.1B, so no 32-bit assumptions. */
export function formatListingPrice(l: Pick<MatchedListing, "listingType" | "rent" | "rentPeriod">): string {
	return l.listingType === "SALE" ? formatNaira(l.rent) : formatRentPrice(l.rent, l.rentPeriod);
}

const homes = (n: number) => (n === 1 ? "1 new home" : `${n} new homes`);

function listingRow(l: MatchedListing): string {
	const href = escapeHtml(`${siteUrl()}/property/${l.id}`);
	const photo =
		l.photoUrl && l.photoUrl.startsWith("https://")
			? `<td width="72" valign="top" style="padding-right:12px;"><a href="${href}"><img src="${escapeHtml(l.photoUrl)}" width="72" height="72" alt="${escapeHtml(l.title)}" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:8px;border:0;"></a></td>`
			: "";
	return `<tr>${photo}<td valign="top" style="padding-bottom:14px;">
        <a href="${href}" class="value-text" style="font-size:15px;font-weight:600;color:#161515;text-decoration:none;">${escapeHtml(l.title)}</a>
        <div class="muted-65" style="font-size:13px;color:rgba(10,10,10,0.65);margin-top:2px;">${escapeHtml(l.area)}, ${escapeHtml(l.city)}</div>
        <div class="value-text" style="font-size:14px;font-weight:600;color:#161515;margin-top:4px;">${escapeHtml(formatListingPrice(l))}</div>
      </td></tr>`;
}

function groupBlock(g: MatchedSearchGroup): string {
	const seeAll =
		g.total > g.listings.length
			? `<p style="margin:4px 0 0;font-size:13px;"><a href="${escapeHtml(siteUrl() + g.resultsPath)}" style="color:#af2525;font-weight:600;text-decoration:none;">See all ${g.total} &rarr;</a></p>`
			: "";
	return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="details-box" style="background:#faf9f9;border:1px solid rgba(186,186,186,0.65);border-radius:12px;margin-bottom:16px;">
    <tr><td style="padding:20px 20px 6px;">
      <div class="label-muted" style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:rgba(10,10,10,0.4);margin-bottom:12px;">${escapeHtml(g.searchName)} &middot; ${homes(g.total)}</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${g.listings.map(listingRow).join("")}</table>
      ${seeAll}
    </td></tr>
  </table>`;
}

interface SendSavedSearchMatchesParams {
	to: string;
	name?: string | null;
	groups: MatchedSearchGroup[];
}

/**
 * One email per user per run, covering every saved search of theirs that has new
 * matches. Search names and listing titles are user-supplied: everything goes
 * through escapeHtml. Ends with a link to the notification settings.
 */
export async function sendSavedSearchMatchesEmail({ to, name, groups }: SendSavedSearchMatchesParams) {
	const total = groups.reduce((n, g) => n + g.total, 0);
	const subject =
		groups.length === 1
			? `${homes(groups[0].total)} matching "${groups[0].searchName}"`
			: `${homes(total)} matching your saved searches`;
	const settingsUrl = `${siteUrl()}/settings`;
	const savedUrl = `${siteUrl()}/saved-searches`;

	const html = renderShell({
		preheader: `${homes(total)} for your saved ${groups.length === 1 ? "search" : "searches"}.`,
		subject,
		heading: `${homes(total)} for you`,
		intro: `${name ? `Hi ${escapeHtml(name)}, ` : ""}these just went live and match what you saved.`,
		body: groups.map(groupBlock).join(""),
		ctas: ctaButtons({ href: savedUrl, label: "View saved searches" }),
		footnote: `You get this because notifications are on for your saved searches. Change that any time in your settings: ${settingsUrl}`,
	});

	const text = renderText([
		subject,
		"",
		...groups.flatMap((g) => [
			`${g.searchName} — ${homes(g.total)}`,
			...g.listings.map((l) => `- ${l.title} · ${l.area}, ${l.city} · ${formatListingPrice(l)}\n  ${siteUrl()}/property/${l.id}`),
			...(g.total > g.listings.length ? [`See all ${g.total}: ${siteUrl()}${g.resultsPath}`] : []),
			"",
		]),
		`Saved searches: ${savedUrl}`,
		`Notification settings: ${settingsUrl}`,
	]);

	return sendEmail({ to, subject, html, text });
}

