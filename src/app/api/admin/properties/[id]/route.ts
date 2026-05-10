import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";

/**
 * PATCH /api/admin/properties/[id] — admin moderation actions.
 *
 * Body shape (one of):
 *   { action: "approve" }                       → status=ACTIVE,   approvedAt/goesLiveAt=now
 *   { action: "reject", reason: string }        → status=REJECTED, rejectionReason set
 *   { action: "verify" }                        → verificationStatus=VERIFIED, verifiedAt/verifiedBy set,
 *                                                  clears verificationRequestedAt
 *   { action: "unverify", reason?: string }     → verificationStatus=REJECTED (badge denied)
 *   { action: "pause" }                          → status=PAUSED   (admin-side takedown)
 *   { action: "reactivate" }                     → status=ACTIVE
 */

const bodySchema = z.discriminatedUnion("action", [
	z.object({ action: z.literal("approve") }),
	z.object({ action: z.literal("reject"), reason: z.string().min(3).max(500) }),
	z.object({ action: z.literal("verify") }),
	z.object({ action: z.literal("unverify"), reason: z.string().max(500).optional() }),
	z.object({ action: z.literal("pause") }),
	z.object({ action: z.literal("reactivate") }),
]);

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
	const admin = await requireAdmin();
	if (!admin) return err("forbidden", "Admin only", 403);

	const property = await db.property.findUnique({
		where: { id: ctx.params.id },
		select: { id: true },
	});
	if (!property) return err("not_found", "Property not found", 404);

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return err("bad_request", "Invalid JSON body", 400);
	}
	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) return zodErr(parsed.error);
	const action = parsed.data;

	const now = new Date();
	const adminId = admin.user.id;

	switch (action.action) {
		case "approve": {
			const updated = await db.property.update({
				where: { id: property.id },
				data: {
					status: "ACTIVE",
					approvedAt: now,
					goesLiveAt: now,
					rejectionReason: null,
				},
				select: { id: true, status: true },
			});
			return ok(updated);
		}
		case "reject": {
			const updated = await db.property.update({
				where: { id: property.id },
				data: {
					status: "REJECTED",
					rejectionReason: action.reason,
				},
				select: { id: true, status: true },
			});
			return ok(updated);
		}
		case "verify": {
			const updated = await db.property.update({
				where: { id: property.id },
				data: {
					verificationStatus: "VERIFIED",
					verifiedAt: now,
					verifiedBy: adminId,
					verificationRequestedAt: null,
				},
				select: { id: true, verificationStatus: true },
			});
			return ok(updated);
		}
		case "unverify": {
			const updated = await db.property.update({
				where: { id: property.id },
				data: {
					verificationStatus: "REJECTED",
					verifiedAt: null,
					verifiedBy: null,
					verificationRequestedAt: null,
					...(action.reason && { rejectionReason: action.reason }),
				},
				select: { id: true, verificationStatus: true },
			});
			return ok(updated);
		}
		case "pause": {
			const updated = await db.property.update({
				where: { id: property.id },
				data: { status: "PAUSED" },
				select: { id: true, status: true },
			});
			return ok(updated);
		}
		case "reactivate": {
			const updated = await db.property.update({
				where: { id: property.id },
				data: { status: "ACTIVE", goesLiveAt: now },
				select: { id: true, status: true },
			});
			return ok(updated);
		}
	}
}
