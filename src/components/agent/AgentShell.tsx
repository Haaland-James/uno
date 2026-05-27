import type { ReactNode } from "react";
import { AgentSidebar } from "./AgentSidebar";
import { AgentHeader } from "./AgentHeader";

/**
 * Top-level chrome for the authenticated in-house agent console.
 * Two-column on desktop, single column with mobile drawer on mobile.
 *
 * Intentionally separate from the public renter/landlord chrome — agents
 * are doing field operations and need a focused staff surface, not the
 * consumer app shell.
 */
export function AgentShell({
	email,
	children,
}: {
	email?: string | null;
	children: ReactNode;
}) {
	return (
		<div className="md:grid md:grid-cols-[240px_1fr] min-h-screen bg-[#fbfbfb]">
			<AgentSidebar email={email} />
			<div className="flex min-w-0 flex-col">
				<AgentHeader email={email} />
				<main className="flex-1">{children}</main>
			</div>
		</div>
	);
}
