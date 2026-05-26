import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deriveStatusFields } from "@/lib/property-status";
import type { PropertyStatus } from "@prisma/client";

/**
 * PATCH /api/properties/[id]/status — owner status changes.
 *
 * Actions:
 *   pause         → PAUSED   (take off market)
 *   activate      → ACTIVE   (re-list / put back on market)
 *   mark_rented   → RENTED   (property has been let)
 *   mark_available→ ACTIVE   (property is available again)
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
	try {
		body = await req.json();
	} catch {
		return err("bad_request", "Invalid JSON body", 400);
	}
	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) return zodErr(parsed.error);

	const { action } = parsed.data;

	const nextStatus: PropertyStatus =
		action === "pause"
			? "PAUSED"
			: action === "mark_rented"
				? "RENTED"
				: "ACTIVE"; // activate + mark_available

	if (property.status === nextStatus && action !== "mark_rented") {
		return ok({
			id,
			status: property.status,
			message: action === "pause" ? "Already paused" : "Already active",
		});
	}

	const derived = deriveStatusFields(nextStatus, property.availableFrom);
	const updated = await db.property.update({
		where: { id },
		data: { status: nextStatus, ...(derived ?? {}) },
		select: { id: true, status: true, isRented: true, availabilityStatus: true },
	});

	return ok(updated);
}
