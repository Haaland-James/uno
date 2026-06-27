import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { deriveStatusFields } from "@/lib/property-status";

/**
 * PATCH /api/admin/reports/[id] — triage a report.
 *
 * Body (one of):
 *   { action: "resolve", note?, pauseListing? }  → status=RESOLVED; optionally
 *                                                   pause the reported listing
 *   { action: "dismiss", note? }                 → status=DISMISSED (no action)
 *   { action: "reopen" }                         → status=OPEN
 */
const bodySchema = z.discriminatedUnion("action", [
	z.object({
		action: z.literal("resolve"),
		note: z.string().trim().max(500).optional(),
		pauseListing: z.boolean().optional(),
	}),
	z.object({ action: z.literal("dismiss"), note: z.string().trim().max(500).optional() }),
	z.object({ action: z.literal("reopen") }),
]);

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
	const admin = await requireAdmin();
	if (!admin) return err("forbidden", "Admin only", 403);

	const report = await db.report.findUnique({
		where: { id: ctx.params.id },
		select: { id: true, propertyId: true },
	});
	if (!report) return err("not_found", "Report not found", 404);

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

	switch (action.action) {
		case "resolve": {
			if (action.pauseListing) {
				const property = await db.property.findUnique({
					where: { id: report.propertyId },
					select: { availableFrom: true },
				});
				if (property) {
					await db.property.update({
						where: { id: report.propertyId },
						data: {
							status: "PAUSED",
							...(deriveStatusFields("PAUSED", property.availableFrom) ?? {}),
						},
					});
				}
			}
			const updated = await db.report.update({
				where: { id: report.id },
				data: {
					status: "RESOLVED",
					resolution: action.note || null,
					resolvedAt: now,
					resolvedBy: admin.user.id,
				},
				select: { id: true, status: true },
			});
			return ok(updated);
		}
		case "dismiss": {
			const updated = await db.report.update({
				where: { id: report.id },
				data: {
					status: "DISMISSED",
					resolution: action.note || null,
					resolvedAt: now,
					resolvedBy: admin.user.id,
				},
				select: { id: true, status: true },
			});
			return ok(updated);
		}
		case "reopen": {
			const updated = await db.report.update({
				where: { id: report.id },
				data: { status: "OPEN", resolution: null, resolvedAt: null, resolvedBy: null },
				select: { id: true, status: true },
			});
			return ok(updated);
		}
	}
}
