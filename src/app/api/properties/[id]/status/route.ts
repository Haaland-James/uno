import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
		select: { id: true, landlordId: true, status: true },
	});
	if (!property) return err("not_found", "Property not found", 404);

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

	// Determine the new DB state based on the action
	let data: { status: "ACTIVE" | "PAUSED" | "RENTED"; isRented?: boolean };

	switch (action) {
		case "pause":
			if (property.status === "PAUSED") {
				return ok({ id, status: property.status, message: "Already paused" });
			}
			data = { status: "PAUSED" };
			break;

		case "activate":
			if (property.status === "ACTIVE") {
				return ok({ id, status: property.status, message: "Already active" });
			}
			data = { status: "ACTIVE", isRented: false };
			break;

		case "mark_rented":
			data = { status: "RENTED", isRented: true };
			break;

		case "mark_available":
			data = { status: "ACTIVE", isRented: false };
			break;
	}

	const updated = await db.property.update({
		where: { id },
		data,
		select: { id: true, status: true, isRented: true },
	});

	return ok(updated);
}
