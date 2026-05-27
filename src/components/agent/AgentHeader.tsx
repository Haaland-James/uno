import { AgentMobileMenu } from "./AgentSidebar";

/**
 * Slim top bar that sits above agent console content. Mirrors AdminHeader.
 * Shows environment badge (so field agents know they're not on prod by
 * accident during training) and the signed-in agent's email.
 */
export function AgentHeader({ email }: { email?: string | null }) {
	const env = (process.env.NEXT_PUBLIC_APP_ENV ?? "DEV").toUpperCase();
	const isProd = env === "PROD" || env === "PRODUCTION";

	return (
		<header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-3 border-b border-black/10 bg-white px-4 md:px-6">
			<div className="flex items-center gap-2">
				<div className="md:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-md bg-[#1a1717]">
					<AgentMobileMenu email={email} />
				</div>
				<span className="text-sm font-semibold text-content-primary md:hidden">
					UNO <span className="text-uno-red">Agents</span>
				</span>
			</div>

			<div className="flex items-center gap-3">
				<span
					className={
						isProd
							? "rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-red-700"
							: "rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-700"
					}
				>
					{env}
				</span>
				{email && (
					<span
						className="hidden sm:inline text-xs text-content-secondary truncate max-w-[200px]"
						title={email}
					>
						{email}
					</span>
				)}
			</div>
		</header>
	);
}
