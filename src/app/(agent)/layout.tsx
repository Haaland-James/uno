import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AgentShell } from "@/components/agent/AgentShell";

/**
 * Gated layout for the in-house agent console (/agent/dashboard, /agent/listings,
 * etc.). Defence-in-depth alongside middleware: any non-agent who slips through
 * gets bounced back with a meaningful error.
 *
 * Admins pass so they can troubleshoot the agent console without swapping
 * accounts. EXTERNAL agents (Phase 2) do NOT use this portal — they live
 * inside the consumer app at /listing/*.
 */
export default async function AgentLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/agent/login?callbackUrl=/agent");

	const { role, agentStatus, agentEmployment } = session.user;
	const isInHouseAgent =
		agentStatus === "VERIFIED" && agentEmployment === "IN_HOUSE";
	if (role !== "ADMIN" && !isInHouseAgent) {
		redirect("/agent/login?error=not_agent");
	}

	return <AgentShell email={session.user.email}>{children}</AgentShell>;
}
