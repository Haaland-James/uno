import {
	sendEmail,
	escapeHtml,
	detailsBox,
	ctaButtons,
	renderShell,
	renderText,
	type DetailRow,
} from "./render";
import { siteConfig } from "@/../config/site";
import { siteUrl } from "@/lib/site";
import { formatNaira } from "@/lib/utils";

export interface PriceDropItem {
	propertyId: string;
	title: string;
	area: string;
	city: string;
	listingType: "RENT" | "LEASE" | "SALE";
	rentPeriod: "MONTH" | "YEAR";
	oldPrice: number;
	newPrice: number;
}

interface SendPriceDropParams {
	to: string;
	name?: string | null;
	drops: PriceDropItem[];
}

/**
 * "₦5,000,000,000" for a sale, "₦2,500,000/yr" for rent and lease. Sale prices
 * are a one-off figure, so they never carry a period suffix.
 */
export function formatDropPrice(
	amount: number,
	listingType: PriceDropItem["listingType"],
	rentPeriod: PriceDropItem["rentPeriod"],
): string {
	const base = formatNaira(amount);
	if (listingType === "SALE") return base;
	return `${base}/${rentPeriod === "YEAR" ? "yr" : "mo"}`;
}

/** What the drop saves, as an amount and a whole percent (never rounds to 0%). */
export function describeSaving(oldPrice: number, newPrice: number): { amount: number; percent: string } {
	const amount = oldPrice - newPrice;
	const pct = oldPrice > 0 ? (amount / oldPrice) * 100 : 0;
	return { amount, percent: pct < 1 ? "<1%" : `${Math.round(pct)}%` };
}

export async function sendPriceDropEmail({ to, name, drops }: SendPriceDropParams) {
	const base = siteUrl();
	const BRAND = siteConfig.name;
	const many = drops.length > 1;
	const first = drops[0];

	const subject = many
		? `${drops.length} homes you saved just dropped in price`
		: `Price drop: ${first.title}`;
	const greeting = name ? `Hi ${escapeHtml(name.split(" ")[0])},` : "Hi there,";
	const settingsUrl = `${base}/settings`;

	const rows: DetailRow[] = drops.map((d, i) => {
		const { amount, percent } = describeSaving(d.oldPrice, d.newPrice);
		const was = formatDropPrice(d.oldPrice, d.listingType, d.rentPeriod);
		const now = formatDropPrice(d.newPrice, d.listingType, d.rentPeriod);
		const url = `${base}/property/${encodeURIComponent(d.propertyId)}`;
		return {
			label: escapeHtml(`${d.area}, ${d.city}`),
			value: `<a href="${escapeHtml(url)}" style="color:inherit;text-decoration:underline;">${escapeHtml(d.title)}</a>`,
			subline: `<span class="strike-price" style="text-decoration:line-through;color:rgba(10,10,10,0.4);">${escapeHtml(was)}</span> &rarr; <strong>${escapeHtml(now)}</strong><br/>You save ${escapeHtml(formatNaira(amount))} (${escapeHtml(percent)})`,
			dividerBefore: i > 0,
		};
	});

	const html = renderShell({
		preheader: many
			? `${drops.length} of your saved homes now cost less.`
			: `${first.title} now costs less.`,
		subject,
		heading: many ? "Prices dropped on homes you saved" : "A home you saved just got cheaper",
		intro: `${greeting}<br/>${many ? "These homes from your favourites have a lower price" : "This home from your favourites has a lower price"} since we last checked.`,
		body: detailsBox(rows),
		ctas: ctaButtons(
			many
				? { href: `${base}/favourites`, label: "View your saved homes" }
				: { href: `${base}/property/${encodeURIComponent(first.propertyId)}`, label: "View listing" },
			{ href: settingsUrl, label: "Notification settings" },
		),
		footnote: `You get these because you saved the home on ${BRAND}. Turn price-drop alerts off any time in your notification settings.`,
	});

	const text = renderText([
		subject,
		"",
		...drops.flatMap((d) => {
			const { amount, percent } = describeSaving(d.oldPrice, d.newPrice);
			return [
				`${d.title} — ${d.area}, ${d.city}`,
				`${formatDropPrice(d.oldPrice, d.listingType, d.rentPeriod)} -> ${formatDropPrice(d.newPrice, d.listingType, d.rentPeriod)} (save ${formatNaira(amount)}, ${percent})`,
				`${base}/property/${encodeURIComponent(d.propertyId)}`,
				"",
			];
		}),
		`Notification settings: ${settingsUrl}`,
	]);

	return sendEmail({ to, subject, html, text });
}
