import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import type { Prisma, Role } from "@prisma/client";

/**
 * GET /api/admin/users — paginated user list with filters.
 *
 * Query:
 *   ?role=RENTER|LANDLORD|AGENT|ADMIN|ALL    (default ALL)
 *   ?q=     free-text on name / email / phone
 *   ?page=  1-indexed, page size 50
 */
export async function GET(req: NextRequest) {
	const admin = await requireAdmin();
	if (!admin) return err("forbidden", "Admin only", 403);

	const sp = req.nextUrl.searchParams;
	const roleParam = sp.get("role");
	const q = sp.get("q")?.trim();
	const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);
	const pageSize = 50;

	const where: Prisma.UserWhereInput = {
		...(roleParam &&
			roleParam !== "ALL" && {
				role: roleParam as Role,
			}),
		...(q && {
			OR: [
				{ name: { contains: q, mode: "insensitive" } },
				{ email: { contains: q, mode: "insensitive" } },
				{ phone: { contains: q, mode: "insensitive" } },
			],
		}),
	};

	const [items, total] = await Promise.all([
		db.user.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				role: true,
				emailVerified: true,
				phoneVerified: true,
				createdAt: true,
				_count: { select: { properties: true, contactsSent: true } },
			},
		}),
		db.user.count({ where }),
	]);

	return ok({ items, total, page, pageSize });
}
