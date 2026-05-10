import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/properties/[id]/request-verification — owner asks for the Verified badge.
 *
 * Sets `verificationRequestedAt = now()`. Surfaces the listing in the admin queue's
 * "Verification requests" tab. The actual verification (phone call + doc check) is a
 * manual workflow today; admin flips status via PATCH /api/admin/properties/[id]
 * with action=verify when satisfied.
 *
 * Idempotent — re-submitting just refreshes the timestamp.
 */
export async function POST(_req: NextRequest, ctx: { params: { id: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return err("unauthorized", "Sign in", 401);

	const property = await db.property.findUnique({
		where: { id: ctx.params.id },
		select: { id: true, landlordId: true, status: true, verificationStatus: true },
	});
	if (!property) return err("not_found", "Property not found", 404);
	if (property.landlordId !== session.user.id) {
		return err("forbidden", "Not your listing", 403);
	}
	if (property.status !== "ACTIVE") {
		return err("bad_request", "Listing must be live before requesting verification", 400);
	}
	if (property.verificationStatus === "VERIFIED") {
		return err("bad_request", "Listing is already verified", 400);
	}

	const updated = await db.property.update({
		where: { id: property.id },
		data: { verificationRequestedAt: new Date() },
		select: { id: true, verificationRequestedAt: true },
	});

	return ok(updated);
}
