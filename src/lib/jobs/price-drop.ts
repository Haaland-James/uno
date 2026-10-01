import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { sendBestEffort } from "@/lib/email/render";
import { sendPriceDropEmail, type PriceDropItem } from "@/lib/email/price-drop";

/**
 * Redis key holding the ISO time of the last window this job has covered.
 * Local dev, staging and production share one Upstash store, so the key carries
 * the environment name: a run elsewhere must never move production's watermark.
 */
export function priceDropWatermarkKey(): string {
	const env = (process.env.NEXT_PUBLIC_APP_ENV || "DEV").trim().toUpperCase() || "DEV";
	return `jobs:price-drop:last-run:${env}`;
}

/** Most history rows read per run; a bigger backlog carries over to the next run. */
const MAX_ROWS = 2000;
/** Stop sending after this long so a slow run ends cleanly (QStash would retry a timeout). */
const TIME_BUDGET_MS = 20_000;

export interface PriceDropSummary {
	/** History rows read in the window. */
	scanned: number;
	/** Listings whose price ended lower than before the window. */
	drops: number;
	/** Users with at least one drop worth emailing. */
	recipients: number;
	emailed: number;
	failed: number;
	/** Recipients not reached because the time budget ran out. */
	skipped: number;
	/** True on the very first run, which only sets the watermark. */
	firstRun: boolean;
}

type Price = { rent: number; rentPeriod: "MONTH" | "YEAR"; listingType: "RENT" | "LEASE" | "SALE" };

/** A drop is a lower rent at the *same* listing type and period; anything else is a re-pricing. */
export function isDrop(before: Price, after: Price): boolean {
	return (
		before.listingType === after.listingType &&
		before.rentPeriod === after.rentPeriod &&
		before.rent > after.rent
	);
}

function empty(firstRun: boolean): PriceDropSummary {
	return { scanned: 0, drops: 0, recipients: 0, emailed: 0, failed: 0, skipped: 0, firstRun };
}

export async function runPriceDrop(now: Date): Promise<PriceDropSummary> {
	const key = priceDropWatermarkKey();
	const stored = await redis.get<string>(key);
	const since = stored ? new Date(stored) : null;

	// First run (or an unreadable value): start from now, no back-catalogue blast.
	if (!since || Number.isNaN(since.getTime())) {
		await redis.set(key, now.toISOString());
		return empty(true);
	}

	const rows = await db.priceHistory.findMany({
		where: { createdAt: { gt: since, lte: now } },
		orderBy: { createdAt: "asc" },
		take: MAX_ROWS,
		select: { propertyId: true, rent: true, rentPeriod: true, listingType: true, createdAt: true },
	});

	// Move the watermark before anything is sent: a missed email beats a duplicate.
	// A full batch only covers part of the window, so stop at its last row and let
	// the next run pick up from there.
	const windowEnd = rows.length === MAX_ROWS ? rows[rows.length - 1].createdAt : now;
	await redis.set(key, windowEnd.toISOString());

	const summary = empty(false);
	summary.scanned = rows.length;
	if (rows.length === 0) return summary;

	// Newest row per listing in the window (rows are oldest-first, so last wins).
	const newest = new Map<string, Price>();
	for (const r of rows) newest.set(r.propertyId, r);
	const propertyIds = Array.from(newest.keys());

	// The price each listing had before the window opened.
	const before = await db.priceHistory.findMany({
		where: { propertyId: { in: propertyIds }, createdAt: { lte: since } },
		orderBy: { createdAt: "desc" },
		distinct: ["propertyId"],
		select: { propertyId: true, rent: true, rentPeriod: true, listingType: true },
	});

	const dropped = new Map<string, { oldPrice: number; after: Price }>();
	for (const b of before) {
		const after = newest.get(b.propertyId);
		if (after && isDrop(b, after)) dropped.set(b.propertyId, { oldPrice: b.rent, after });
	}
	if (dropped.size === 0) return summary;

	const properties = await db.property.findMany({
		where: { id: { in: Array.from(dropped.keys()) }, status: "ACTIVE", deletedAt: null },
		select: { id: true, title: true, area: true, city: true, landlordId: true },
	});
	summary.drops = properties.length;
	if (properties.length === 0) return summary;
	const byId = new Map(properties.map((p) => [p.id, p]));

	const favourites = await db.favourite.findMany({
		where: {
			propertyId: { in: properties.map((p) => p.id) },
			user: { notifyPriceDrops: true, deactivatedAt: null },
		},
		select: { userId: true, propertyId: true, user: { select: { email: true, name: true } } },
	});

	const perUser = new Map<string, { email: string; name: string | null; drops: PriceDropItem[] }>();
	for (const f of favourites) {
		const property = byId.get(f.propertyId);
		const drop = dropped.get(f.propertyId);
		if (!property || !drop || !f.user.email) continue;
		if (f.userId === property.landlordId) continue; // never alert a lister about their own cut
		const entry = perUser.get(f.userId) ?? { email: f.user.email, name: f.user.name ?? null, drops: [] };
		entry.drops.push({
			propertyId: property.id,
			title: property.title,
			area: property.area,
			city: property.city,
			listingType: drop.after.listingType,
			rentPeriod: drop.after.rentPeriod,
			oldPrice: drop.oldPrice,
			newPrice: drop.after.rent,
		});
		perUser.set(f.userId, entry);
	}
	summary.recipients = perUser.size;

	const deadline = Date.now() + TIME_BUDGET_MS;
	for (const [userId, entry] of Array.from(perUser)) {
		if (Date.now() > deadline) {
			summary.skipped += 1;
			continue;
		}
		let sent = false;
		await sendBestEffort(async () => {
			await sendPriceDropEmail({ to: entry.email, name: entry.name, drops: entry.drops });
			sent = true;
		}, `price-drop to user ${userId}`);
		if (sent) summary.emailed += 1;
		else summary.failed += 1;
	}
	return summary;
}
