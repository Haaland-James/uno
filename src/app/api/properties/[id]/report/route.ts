import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, zodErr, getClientIp } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { reportLimiter } from "@/lib/ratelimit";

/**
 * POST /api/properties/[id]/report — submit a report against a listing.
 *
 * Open to everyone (guests included); attaches reporterId when signed in.
 * Signed-in users are de-duped: a second OPEN report on the same listing
 * is rejected so one person can't spam the queue.
 */
const bodySchema = z.object({
	reason: z.enum(["SCAM", "INACCURATE", "UNAVAILABLE", "DUPLICATE", "OFFENSIVE", "OTHER"]),
	details: z.string().trim().max(1000).optional(),
});

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
	// Per-IP because guests can report — the signed-in dedup below doesn't
	// protect against anonymous queue flooding.
	const rl = await reportLimiter.limit(getClientIp(req));
	if (!rl.success) {
		return err("rate_limited", "You've reported several listings recently — try again later.", 429);
	}

	const property = await db.property.findUnique({
		where: { id: ctx.params.id },
		select: { id: true, deletedAt: true },
	});
	if (!property || property.deletedAt) {
		return err("not_found", "Property not found", 404);
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return err("bad_request", "Invalid JSON body", 400);
	}
	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) return zodErr(parsed.error);

	const session = await getServerSession(authOptions);
	const reporterId = session?.user?.id ?? null;

	if (reporterId) {
		const existing = await db.report.findFirst({
			where: { propertyId: property.id, reporterId, status: "OPEN" },
			select: { id: true },
		});
		if (existing) {
			return err(
				"conflict",
				"You've already reported this listing. Our team is reviewing it.",
				409
			);
		}
	}

	await db.report.create({
		data: {
			propertyId: property.id,
			reporterId,
			reason: parsed.data.reason,
			details: parsed.data.details || null,
		},
		select: { id: true },
	});

	return ok({ ok: true });
}
