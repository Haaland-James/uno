import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { isAnyCanonicalLgaArea } from "@/lib/admin-stats";
import type { Prisma, PropertyStatus, VerificationStatus } from "@prisma/client";

/**
 * GET /api/admin/properties — admin queue.
 * Query: ?status=PENDING|ACTIVE|REJECTED|... (default PENDING)
 *        ?verification=PENDING|VERIFIED|REJECTED
 *        ?verifyRequested=1 — only listings with a pending verification request
 *        ?pendingArea=1    — only listings whose typed area isn't in canonical
 *                            coverage (candidates for "approve area" admin flow)
 *        ?q=  free-text on title/area/city
 */
export async function GET(req: NextRequest) {
	const admin = await requireAdmin();
	if (!admin) return err("forbidden", "Admin only", 403);

	const sp = req.nextUrl.searchParams;
	const status = (sp.get("status") || "PENDING") as PropertyStatus | "ALL";
	const verification = sp.get("verification") as VerificationStatus | null;
	const verifyRequested = sp.get("verifyRequested") === "1";
	const pendingArea = sp.get("pendingArea") === "1";
	const includeDeleted = sp.get("includeDeleted") === "1";
	const q = sp.get("q")?.trim();

	const where: Prisma.PropertyWhereInput = {
		...(!includeDeleted && { deletedAt: null }),
		...(status !== "ALL" && { status }),
		...(verification && { verificationStatus: verification }),
		...(verifyRequested && { verificationRequestedAt: { not: null } }),
		...(q && {
			OR: [
				{ title: { contains: q, mode: "insensitive" } },
				{ area: { contains: q, mode: "insensitive" } },
				{ city: { contains: q, mode: "insensitive" } },
			],
		}),
	};

	const raw = await db.property.findMany({
		where,
		orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
		include: {
			photos: { orderBy: { order: "asc" }, take: 1 },
			landlord: { select: { id: true, name: true, email: true, phone: true } },
		},
		// Pull more when the post-filter will trim — keeps page useful.
		take: pendingArea ? 500 : 100,
	});

	// Pending-area filter is derived on the fly: a listing is "pending area"
	// when its (state, lga, area) triple isn't in AREAS_BY_LGA. We keep this
	// in TS rather than a DB column so adding the area to canonical coverage
	// retroactively clears it for every existing listing.
	// NOTE: Property doesn't store `state` directly, so we approximate using
	// the lister's location-step inputs that *do* live on the row: lga + area.
	// We test against every state's entry for that lga.
	const items = pendingArea
		? raw.filter((p) => !isAnyCanonicalLgaArea(p.lga, p.area))
		: raw;

	return ok({ items: items.slice(0, 100), total: items.length });
}
