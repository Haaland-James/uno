/**
 * Public route group for agent staff authentication surfaces
 * (/agent/login, /agent/verify). Intentionally lightweight: NO session
 * check here so agents can sign in. Bouncing of already-signed-in
 * agents is handled in middleware.
 *
 * Mirrors (admin-auth)/layout.tsx so the two staff portals stay visually
 * consistent — both use the dark institutional chrome.
 */
export default function AgentAuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-[#0f1112] text-white">
			{children}
		</div>
	);
}
