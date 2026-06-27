import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { requireAgent } from "@/lib/agent";
import type { AgentSpecialization } from "@prisma/client";

const bodySchema = z.object({
	bio: z.string().trim().max(600).optional(),
	photo: z.string().trim().url().optional().or(z.literal("")),
	territory: z.array(z.string().trim().min(1).max(60)).max(10).optional(),
	specializations: z.array(z.enum(["RENTALS", "SALES", "COMMERCIAL"])).optional(),
});

export async function PATCH(req: NextRequest) {
	const session = await requireAgent();
	if (!session) return err("unauthorized", "Agent sign-in required", 401);

	let body: unknown;
	try { body = await req.json(); } catch { return err("bad_json", "Invalid JSON", 400); }

	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) return zodErr(parsed.error);

	const { bio, photo, territory, specializations } = parsed.data;

	const updated = await db.user.update({
		where: { id: session.user.id },
		data: {
			...(bio !== undefined && { agentBio: bio || null }),
			...(photo !== undefined && { agentPhoto: photo || null }),
			...(territory !== undefined && { agentTerritory: territory }),
			...(specializations !== undefined && {
				agentSpecializations: specializations as AgentSpecialization[],
			}),
		},
		select: {
			agentBio: true,
			agentPhoto: true,
			agentTerritory: true,
			agentSpecializations: true,
		},
	});

	return ok(updated);
}
