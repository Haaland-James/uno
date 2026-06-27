import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import type { Prisma, AgentStatus } from "@prisma/client";

/**
 * GET /api/admin/agents — list users who are agents.
 *
 * "Agent" is defined by agentStatus != NONE (NOT by role), since that's the
 * signal the /agent/* console and public profiles gate on. `make-agent` and
 * the admin convert action both also set role=AGENT for UI consistency, but
 * the canonical filter here is agentStatus.
 *
 * Query:
 *   ?status=VERIFIED|PENDING|SUSPENDED|ALL   (default ALL non-NONE)
 *   ?q=     free-text on name / email / slug
 */
export async function GET(req: NextRequest) {
	const admin = await requireAdmin();
	if (!admin) return err("forbidden", "Admin only", 403);

	const sp = req.nextUrl.searchParams;
	const statusParam = sp.get("status");
	const q = sp.get("q")?.trim();

	const where: Prisma.UserWhereInput = {
		agentStatus:
			statusParam && statusParam !== "ALL"
				? (statusParam as AgentStatus)
				: { not: "NONE" },
		...(q && {
			OR: [
				{ name: { contains: q, mode: "insensitive" } },
				{ email: { contains: q, mode: "insensitive" } },
				{ agentSlug: { contains: q, mode: "insensitive" } },
			],
		}),
	};

	const items = await db.user.findMany({
		where,
		orderBy: [{ agentStatus: "asc" }, { createdAt: "desc" }],
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			photo: true,
			agentStatus: true,
			agentEmployment: true,
			agentSlug: true,
			agentPhoto: true,
			agentTerritory: true,
			agentSpecializations: true,
			agentVerifiedAt: true,
			_count: { select: { properties: true } },
		},
	});

	return ok({ items, total: items.length });
}
