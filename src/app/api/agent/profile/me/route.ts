import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAgent } from "@/lib/agent";

export async function GET() {
	const session = await requireAgent();
	if (!session) return err("unauthorized", "Agent sign-in required", 401);

	const agent = await db.user.findUnique({
		where: { id: session.user.id },
		select: {
			name: true,
			email: true,
			photo: true,
			agentSlug: true,
			agentBio: true,
			agentPhoto: true,
			agentTerritory: true,
			agentSpecializations: true,
			agentVerifiedAt: true,
		},
	});

	if (!agent) return err("not_found", "Agent not found", 404);
	return ok(agent);
}
