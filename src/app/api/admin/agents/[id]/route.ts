import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import type { AgentSpecialization } from "@prisma/client";

/**
 * GET /api/admin/agents/[id] — full agent record for the detail page:
 * profile, their listings, off-platform owners (grouped by phone), and
 * aggregate metrics.
 */
export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
	const admin = await requireAdmin();
	if (!admin) return err("forbidden", "Admin only", 403);

	const agent = await db.user.findUnique({
		where: { id: ctx.params.id },
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			photo: true,
			role: true,
			agentStatus: true,
			agentEmployment: true,
			agentSlug: true,
			agentBio: true,
			agentPhoto: true,
			agentTerritory: true,
			agentSpecializations: true,
			agentVerifiedAt: true,
			createdAt: true,
		},
	});
	if (!agent || agent.agentStatus === "NONE") {
		return err("not_found", "Agent not found", 404);
	}

	const listings = await db.property.findMany({
		where: { landlordId: agent.id, deletedAt: null },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			title: true,
			area: true,
			city: true,
			state: true,
			status: true,
			rent: true,
			rentPeriod: true,
			views: true,
			contactCount: true,
			listedByAgent: true,
			offPlatformOwnerName: true,
			offPlatformOwnerPhone: true,
			createdAt: true,
		},
	});

	// Aggregate metrics
	const metrics = {
		totalListings: listings.length,
		activeListings: listings.filter((l) => l.status === "ACTIVE").length,
		totalViews: listings.reduce((sum, l) => sum + l.views, 0),
		totalContacts: listings.reduce((sum, l) => sum + l.contactCount, 0),
	};

	// Off-platform owners grouped by phone
	const byPhone = new Map<
		string,
		{ name: string | null; phone: string; count: number }
	>();
	for (const l of listings) {
		if (!l.listedByAgent || !l.offPlatformOwnerPhone) continue;
		const phone = l.offPlatformOwnerPhone;
		const existing = byPhone.get(phone);
		if (existing) {
			existing.count += 1;
			if (!existing.name && l.offPlatformOwnerName) existing.name = l.offPlatformOwnerName;
		} else {
			byPhone.set(phone, { name: l.offPlatformOwnerName, phone, count: 1 });
		}
	}
	const owners = Array.from(byPhone.values()).sort((a, b) => b.count - a.count);

	return ok({ agent, listings, owners, metrics });
}

/**
 * PATCH /api/admin/agents/[id] — manage an existing agent.
 *
 * Body (one of):
 *   { action: "updateProfile", bio?, photo?, territory?, specializations?, employment? }
 *   { action: "suspend" }     → agentStatus=SUSPENDED (loses /agent/* access)
 *   { action: "reinstate" }   → agentStatus=VERIFIED
 */
const bodySchema = z.discriminatedUnion("action", [
	z.object({
		action: z.literal("updateProfile"),
		bio: z.string().trim().max(600).optional(),
		photo: z.string().trim().url().optional().or(z.literal("")),
		territory: z.array(z.string().trim().min(1).max(60)).max(10).optional(),
		specializations: z.array(z.enum(["RENTALS", "SALES", "COMMERCIAL"])).optional(),
		employment: z.enum(["IN_HOUSE", "EXTERNAL"]).optional(),
	}),
	z.object({ action: z.literal("suspend") }),
	z.object({ action: z.literal("reinstate") }),
]);

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
	const admin = await requireAdmin();
	if (!admin) return err("forbidden", "Admin only", 403);

	const target = await db.user.findUnique({
		where: { id: ctx.params.id },
		select: { id: true, agentStatus: true },
	});
	if (!target || target.agentStatus === "NONE") {
		return err("not_found", "Agent not found", 404);
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return err("bad_request", "Invalid JSON body", 400);
	}
	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) return zodErr(parsed.error);
	const action = parsed.data;

	switch (action.action) {
		case "updateProfile": {
			const { bio, photo, territory, specializations, employment } = action;
			const updated = await db.user.update({
				where: { id: target.id },
				data: {
					...(bio !== undefined && { agentBio: bio || null }),
					...(photo !== undefined && { agentPhoto: photo || null }),
					...(territory !== undefined && { agentTerritory: territory }),
					...(specializations !== undefined && {
						agentSpecializations: specializations as AgentSpecialization[],
					}),
					...(employment !== undefined && { agentEmployment: employment }),
				},
				select: {
					agentBio: true,
					agentPhoto: true,
					agentTerritory: true,
					agentSpecializations: true,
					agentEmployment: true,
				},
			});
			return ok(updated);
		}
		case "suspend": {
			const updated = await db.user.update({
				where: { id: target.id },
				data: { agentStatus: "SUSPENDED" },
				select: { id: true, agentStatus: true },
			});
			return ok(updated);
		}
		case "reinstate": {
			const updated = await db.user.update({
				where: { id: target.id },
				data: { agentStatus: "VERIFIED", agentVerifiedAt: new Date(), agentVerifiedBy: admin.user.id },
				select: { id: true, agentStatus: true },
			});
			return ok(updated);
		}
	}
}
