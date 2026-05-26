import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { isAnyCanonicalLgaArea } from "@/lib/admin-stats";

/**
 * GET /api/admin/stats — aggregate counts for the dashboard.
 * Single endpoint so the dashboard does one round-trip instead of N.
 * Counts are cheap (Prisma _count.count + groupBy) but the pending-area
 * count needs a post-filter so it touches up to 500 rows.
 */
export async function GET() {
	const admin = await requireAdmin();
	if (!admin) return err("forbidden", "Admin only", 403);

	const now = new Date();
	const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

	const [
		listingsByStatus,
		verifyRequested,
		usersByRole,
		signups7d,
		newListings7d,
		contacts7d,
		pendingAreaCandidates,
	] = await Promise.all([
		db.property.groupBy({
			by: ["status"],
			where: { deletedAt: null },
			_count: { _all: true },
		}),
		db.property.count({
			where: { deletedAt: null, verificationRequestedAt: { not: null } },
		}),
		db.user.groupBy({ by: ["role"], _count: { _all: true } }),
		db.user.count({ where: { createdAt: { gte: weekAgo } } }),
		db.property.count({
			where: { deletedAt: null, createdAt: { gte: weekAgo } },
		}),
		db.contactRequest.count({ where: { createdAt: { gte: weekAgo } } }),
		// Pending-area is a derived filter (state/lga/area triple not in coverage);
		// pull a window of recent rows and post-filter, mirroring the queue endpoint.
		db.property.findMany({
			where: { deletedAt: null, status: { in: ["PENDING", "ACTIVE"] } },
			select: { id: true, lga: true, area: true },
			take: 500,
			orderBy: { createdAt: "desc" },
		}),
	]);

	const listings = {
		total: 0,
		draft: 0,
		pending: 0,
		active: 0,
		paused: 0,
		rented: 0,
		rejected: 0,
		verifyRequested,
		pendingArea: pendingAreaCandidates.filter(
			(p) => !isAnyCanonicalLgaArea(p.lga, p.area)
		).length,
	};
	for (const row of listingsByStatus) {
		const n = row._count._all;
		listings.total += n;
		switch (row.status) {
			case "DRAFT":
				listings.draft = n;
				break;
			case "PENDING":
				listings.pending = n;
				break;
			case "ACTIVE":
				listings.active = n;
				break;
			case "PAUSED":
				listings.paused = n;
				break;
			case "RENTED":
				listings.rented = n;
				break;
			case "REJECTED":
				listings.rejected = n;
				break;
		}
	}

	const users = {
		total: 0,
		renters: 0,
		landlords: 0,
		agents: 0,
		admins: 0,
	};
	for (const row of usersByRole) {
		const n = row._count._all;
		users.total += n;
		switch (row.role) {
			case "RENTER":
				users.renters = n;
				break;
			case "LANDLORD":
				users.landlords = n;
				break;
			case "AGENT":
				users.agents = n;
				break;
			case "ADMIN":
				users.admins = n;
				break;
		}
	}

	return ok({
		listings,
		users,
		activity: {
			signups7d,
			newListings7d,
			contacts7d,
		},
	});
}
