import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { PropertyStatus } from "@prisma/client";

/**
 * PATCH /api/properties/[id]/status — owner status changes.
 *
 * Actions:
 *   pause          → status=PAUSED  (take off market, hides from feed)
 *   activate       → status=ACTIVE  (re-list)
 *   mark_rented    → isRented=true, availabilityStatus=RENTED, rentedAt=now
 *                    status stays ACTIVE — property remains visible with a
 *                    "Rented" badge. Does NOT unpublish the listing.
 *   mark_available → isRented=false, availabilityStatus=AVAILABLE_NOW, rentedAt=null
 */

const bodySchema = z.object({
	action: z.enum(["pause", "activate", "mark_rented", "mark_available"]),
});

export async function PATCH(
	req: NextRequest,
	ctx: { params: { id: string } }
) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return err("unauthorized", "Sign in to manage your listings", 401);
	}

	const { id } = ctx.params;

	const property = await db.property.findUnique({
		where: { id },
		select: { id: true, landlordId: true, status: true, availableFrom: true, deletedAt: true },
	});
	if (!property || property.deletedAt) return err("not_found", "Property not found", 404);

	const isOwner = property.landlordId === session.user.id;
	const isAdmin = session.user.role === "ADMIN";
	if (!isOwner && !isAdmin) {
		return err("forbidden", "You don't have permission to change this listing's status", 403);
	}

	let body: unknown;
	try { body = await req.json(); }
	catch { return err("bad_request", "Invalid JSON body", 400); }

	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) return zodErr(parsed.error);

	const { action } = parsed.data;

	let updateData: Parameters<typeof db.property.update>[0]["data"];

	if (action === "pause") {
		updateData = { status: "PAUSED" as PropertyStatus };
	} else if (action === "activate") {
		updateData = { status: "ACTIVE" as PropertyStatus };
	} else if (action === "mark_rented") {
		// Keep status=ACTIVE so the listing stays in the feed with a Rented badge
		updateData = {
			isRented: true,
			availabilityStatus: "RENTED",
			rentedAt: new Date(),
		};
	} else {
		// mark_available — clear the rented state, keep published. Only show
		// "available from" when availableFrom is genuinely in the future;
		// a stale past date means it's available now.
		const availableLater =
			!!property.availableFrom && property.availableFrom.getTime() > Date.now();
		updateData = {
			isRented: false,
			availabilityStatus: availableLater ? "AVAILABLE_FROM" : "AVAILABLE_NOW",
			rentedAt: null,
		};
	}

	const updated = await db.property.update({
		where: { id },
		data: updateData,
		select: { id: true, status: true, isRented: true, availabilityStatus: true, rentedAt: true },
	});

	return ok(updated);
}
