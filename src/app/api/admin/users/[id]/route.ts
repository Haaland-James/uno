import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";

/**
 * PATCH /api/admin/users/[id] — admin user actions.
 *
 * Body:
 *   { action: "promote" }   → role = ADMIN
 *   { action: "demote" }    → role = RENTER (refuses if it would leave zero admins)
 *
 * Safety rails:
 *   - Admins cannot demote themselves (avoids accidental lock-out).
 *   - Demoting the LAST admin is rejected (system would have no operators).
 *   - Suspend/unsuspend is intentionally NOT here yet — needs a `suspendedAt`
 *     field on User (deferred migration).
 */

const bodySchema = z.discriminatedUnion("action", [
	z.object({ action: z.literal("promote") }),
	z.object({ action: z.literal("demote") }),
]);

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
	const admin = await requireAdmin();
	if (!admin) return err("forbidden", "Admin only", 403);

	const target = await db.user.findUnique({
		where: { id: ctx.params.id },
		select: { id: true, role: true, name: true, email: true },
	});
	if (!target) return err("not_found", "User not found", 404);

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return err("bad_request", "Invalid JSON body", 400);
	}
	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) return zodErr(parsed.error);

	switch (parsed.data.action) {
		case "promote": {
			if (target.role === "ADMIN") {
				return err("conflict", "User is already an admin", 409);
			}
			const updated = await db.user.update({
				where: { id: target.id },
				data: { role: "ADMIN" },
				select: { id: true, role: true },
			});
			return ok(updated);
		}
		case "demote": {
			if (target.role !== "ADMIN") {
				return err("conflict", "User is not an admin", 409);
			}
			if (target.id === admin.user.id) {
				return err(
					"forbidden",
					"You cannot demote yourself. Ask another admin.",
					403
				);
			}
			const adminCount = await db.user.count({ where: { role: "ADMIN" } });
			if (adminCount <= 1) {
				return err(
					"forbidden",
					"Cannot demote the last remaining admin.",
					403
				);
			}
			const updated = await db.user.update({
				where: { id: target.id },
				data: { role: "RENTER" },
				select: { id: true, role: true },
			});
			return ok(updated);
		}
	}
}
