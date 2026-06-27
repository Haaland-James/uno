import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import type { Prisma, ReportStatus } from "@prisma/client";

/**
 * GET /api/admin/reports — user/guest-submitted listing reports.
 *
 * Query:
 *   ?status=OPEN|RESOLVED|DISMISSED|ALL   (default OPEN)
 *
 * Returns the report plus a lightweight snapshot of the reported listing and
 * the reporter (null for guest reports). Also returns per-status counts so the
 * UI can badge its tabs.
 */
export async function GET(req: NextRequest) {
	const admin = await requireAdmin();
	if (!admin) return err("forbidden", "Admin only", 403);

	const statusParam = req.nextUrl.searchParams.get("status") ?? "OPEN";
	const where: Prisma.ReportWhereInput =
		statusParam && statusParam !== "ALL"
			? { status: statusParam as ReportStatus }
			: {};

	const [items, counts] = await Promise.all([
		db.report.findMany({
			where,
			orderBy: { createdAt: "desc" },
			take: 200,
			select: {
				id: true,
				reason: true,
				details: true,
				status: true,
				resolution: true,
				resolvedAt: true,
				createdAt: true,
				property: {
					select: {
						id: true,
						title: true,
						area: true,
						city: true,
						status: true,
						landlord: { select: { id: true, name: true } },
					},
				},
				reporter: { select: { id: true, name: true, email: true } },
			},
		}),
		db.report.groupBy({ by: ["status"], _count: true }),
	]);

	const countByStatus = { OPEN: 0, RESOLVED: 0, DISMISSED: 0 };
	for (const c of counts) {
		countByStatus[c.status] = c._count;
	}

	return ok({ items, total: items.length, counts: countByStatus });
}
