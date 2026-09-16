import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { notDeleted } from "@/lib/property-status";

/**
 * GET /api/me/analytics — performance overview for the lister's own listings.
 *
 * Mirrors the shape of the agent console's analytics page, scoped to the
 * signed-in user instead of a verified agent.
 *
 * Returns:
 *   totalViews / totalContacts — lifetime totals
 *   publishedListings — ACTIVE properties, matching the "Published" tab on
 *                       My Listings (this codebase treats PUBLISHED == ACTIVE)
 *   totalListings     — every property regardless of status; drives the
 *                       "no data yet" gate, NOT the visible tile
 *   contacts30d      — enquiries received in the last 30 days
 *   months           — last 6 month keys ("YYYY-MM"), oldest first
 *   listingsByMonth  — properties created per month
 *   contactsByMonth  — enquiries received per month
 *   topListings      — up to 10 properties, most-viewed first
 *
 * Note: `views` is a running counter with no per-event timestamps, so there is
 * deliberately no "views in the last 30 days" figure here — it could only be
 * faked. Contacts are timestamped (ContactRequest rows), so their 30-day and
 * per-month numbers are real.
 */
export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return err("unauthorized", "Sign in to view your analytics", 401);
	}

	const userId = session.user.id;
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

	const [listings, contacts6m] = await Promise.all([
		db.property.findMany({
			where: { landlordId: userId, ...notDeleted },
			select: {
				id: true,
				title: true,
				city: true,
				area: true,
				status: true,
				views: true,
				contactCount: true,
				createdAt: true,
			},
			orderBy: { views: "desc" },
		}),

		// Six months of enquiries. The 30-day count is derived from these rows
		// rather than issued as a separate query — the 6-month window contains it.
		db.contactRequest.findMany({
			where: {
				property: { landlordId: userId, ...notDeleted },
				createdAt: { gte: sixMonthsAgo },
			},
			select: { createdAt: true },
		}),
	]);

	// Seed the last 6 months in order so a month with no activity still renders
	// a labelled (empty) column rather than being dropped from the chart.
	const listingsByMonth: Record<string, number> = {};
	for (let i = 5; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		listingsByMonth[monthKey(d)] = 0;
	}
	const contactsByMonth: Record<string, number> = {};
	for (const key of Object.keys(listingsByMonth)) contactsByMonth[key] = 0;

	for (const p of listings) {
		const key = monthKey(new Date(p.createdAt));
		if (key in listingsByMonth) listingsByMonth[key]++;
	}

	let contacts30d = 0;
	for (const c of contacts6m) {
		const key = monthKey(new Date(c.createdAt));
		if (key in contactsByMonth) contactsByMonth[key]++;
		if (c.createdAt >= thirtyDaysAgo) contacts30d++;
	}

	return ok({
		totalViews: listings.reduce((s, p) => s + p.views, 0),
		totalContacts: listings.reduce((s, p) => s + p.contactCount, 0),
		contacts30d,
		publishedListings: listings.filter((p) => p.status === "ACTIVE").length,
		totalListings: listings.length,
		months: Object.keys(listingsByMonth),
		listingsByMonth,
		contactsByMonth,
		// Already ordered by views desc in the query.
		topListings: listings.slice(0, 10).map(({ createdAt: _createdAt, ...p }) => p),
	});
}

function monthKey(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
