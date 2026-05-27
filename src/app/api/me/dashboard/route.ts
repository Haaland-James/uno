import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";

/**
 * GET /api/me/dashboard — aggregated stats for the lister's dashboard.
 *
 * Returns:
 *   activeListings  — count of ACTIVE properties
 *   totalListings   — count of all properties (any status)
 *   totalViews      — sum of views across all properties
 *   totalInquiries  — sum of contactCount across all properties
 *   totalSaves      — sum of savedCount across all properties
 *   recentListings  — last 5 properties ordered by updatedAt
 */
export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return err("unauthorized", "Sign in to view your dashboard", 401);
	}

	const userId = session.user.id;

	const [counts, aggregates, recentListings, unreadContactCount] = await Promise.all([
		// Active vs total counts
		Promise.all([
			db.property.count({ where: { landlordId: userId, status: "ACTIVE", deletedAt: null } }),
			db.property.count({ where: { landlordId: userId, deletedAt: null } }),
		]),

		// Sum views, contactCount, savedCount across all the user's properties
		db.property.aggregate({
			where: { landlordId: userId, deletedAt: null },
			_sum: {
				views: true,
				contactCount: true,
				savedCount: true,
			},
		}),

		// 5 most recently updated properties for "Recent Activity"
		db.property.findMany({
			where: { landlordId: userId, deletedAt: null },
			orderBy: { updatedAt: "desc" },
			take: 5,
			select: {
				id: true,
				title: true,
				status: true,
				views: true,
				contactCount: true,
				savedCount: true,
				updatedAt: true,
				photos: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
			},
		}),

		// Unread tenant enquiries across all of the user's properties — drives
		// the sidebar Messages badge.
		db.contactRequest.count({
			where: {
				property: { landlordId: userId, deletedAt: null },
				status: "UNREAD",
			},
		}),
	]);

	return ok({
		activeListings: counts[0],
		totalListings: counts[1],
		totalViews: aggregates._sum.views ?? 0,
		totalInquiries: aggregates._sum.contactCount ?? 0,
		totalSaves: aggregates._sum.savedCount ?? 0,
		recentListings,
		unreadContactCount,
	});
}
