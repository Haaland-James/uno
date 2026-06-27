import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { uniqueAgentSlug } from "@/lib/agent-slug";

/**
 * PATCH /api/admin/users/[id] — admin user actions.
 *
 * Body:
 *   { action: "promote" }       → role = ADMIN
 *   { action: "demote" }        → role = RENTER (refuses if it would leave zero admins)
 *   { action: "make_agent" }    → in-house UNO agent (role=AGENT, agentStatus=VERIFIED,
 *                                  agentEmployment=IN_HOUSE, unique agentSlug). Replaces
 *                                  the make-agent.ts script.
 *   { action: "revoke_agent" }  → strips agent access (agentStatus=NONE, role=RENTER).
 *                                  Profile fields + slug are kept for easy re-promotion.
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
	z.object({ action: z.literal("make_agent") }),
	z.object({ action: z.literal("revoke_agent") }),
]);

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
	const admin = await requireAdmin();
	if (!admin) return err("forbidden", "Admin only", 403);

	const target = await db.user.findUnique({
		where: { id: ctx.params.id },
		select: {
			id: true,
			role: true,
			name: true,
			email: true,
			agentStatus: true,
			agentSlug: true,
		},
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
		case "make_agent": {
			if (target.agentStatus === "VERIFIED") {
				return err("conflict", "User is already a verified agent", 409);
			}
			if (target.role === "ADMIN") {
				return err("conflict", "Admins can't also be agents. Demote first.", 409);
			}
			// Reuse an existing slug if the user was an agent before; otherwise mint one.
			const slug = target.agentSlug ?? (await uniqueAgentSlug(target.name, target.id));
			const updated = await db.user.update({
				where: { id: target.id },
				data: {
					role: "AGENT",
					agentStatus: "VERIFIED",
					agentEmployment: "IN_HOUSE",
					agentSlug: slug,
					agentVerifiedAt: new Date(),
					agentVerifiedBy: admin.user.id,
				},
				select: { id: true, role: true, agentStatus: true, agentSlug: true },
			});
			return ok(updated);
		}
		case "revoke_agent": {
			if (target.agentStatus === "NONE") {
				return err("conflict", "User is not an agent", 409);
			}
			const updated = await db.user.update({
				where: { id: target.id },
				data: {
					agentStatus: "NONE",
					agentEmployment: null,
					...(target.role === "AGENT" && { role: "RENTER" }),
				},
				select: { id: true, role: true, agentStatus: true },
			});
			return ok(updated);
		}
	}
}
