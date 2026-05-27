import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Returns the session if the caller is a verified in-house UNO agent OR
 * an admin (admins can support agent flows). Returns null otherwise.
 *
 * Pair with `redirect("/agent/login")` in pages and `err("forbidden", ...)`
 * in API routes. Phase 1: only IN_HOUSE agents pass. EXTERNAL agents
 * (Phase 2) will sign in via the consumer portal, not /agent/login.
 */
export async function requireAgent() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return null;
	const { role, agentStatus, agentEmployment } = session.user;
	if (role === "ADMIN") return session;
	if (agentStatus === "VERIFIED" && agentEmployment === "IN_HOUSE") return session;
	return null;
}
