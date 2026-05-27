import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireAgent } from "@/lib/agent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const dynamic = "force-dynamic";

/**
 * Agent's view of their own public profile + an editor for the fields that
 * appear at /agents/[slug]. v1 is read-only with a "coming soon" placeholder
 * for the editor — fields can still be set by admin via /admin/users. Editor
 * UI lands in the next pass; the page is here so the sidebar nav has a
 * destination and agents can see what renters see.
 */
export default async function AgentProfilePage() {
	const session = await requireAgent();
	if (!session) redirect("/agent/login");

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
			agentVerifiedAt: true,
		},
	});

	if (!agent) redirect("/agent/login");

	return (
		<div className="page-container py-4 md:py-6">
			<AdminPageHeader
				title="My Profile"
				description="How renters see you on UNO. Listed properties link back here."
				actions={
					agent.agentSlug ? (
						<Link
							href={`/agents/${agent.agentSlug}`}
							target="_blank"
							className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-content-primary hover:bg-black/[0.02]"
						>
							<ExternalLink className="h-4 w-4" />
							View public profile
						</Link>
					) : null
				}
			/>

			<div className="rounded-lg border border-black/10 bg-white p-6">
				<div className="flex items-start gap-4">
					<div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-black/[0.05]">
						{agent.agentPhoto || agent.photo ? (
							<Image
								src={agent.agentPhoto ?? agent.photo!}
								alt={agent.name}
								width={80}
								height={80}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-content-secondary">
								{agent.name?.[0]?.toUpperCase() ?? "?"}
							</div>
						)}
					</div>
					<div className="min-w-0 flex-1">
						<h2 className="text-lg font-semibold text-content-primary">
							{agent.name}
						</h2>
						<p className="text-sm text-content-secondary">{agent.email}</p>
						<div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-uno-red/10 px-2.5 py-0.5 text-xs font-semibold text-uno-red">
							UNO Verified Agent
						</div>
					</div>
				</div>

				<dl className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<dt className="text-xs uppercase tracking-wide text-content-secondary">
							Public URL
						</dt>
						<dd className="mt-1 text-sm text-content-primary">
							{agent.agentSlug ? (
								<Link
									href={`/agents/${agent.agentSlug}`}
									target="_blank"
									className="text-uno-red hover:underline"
								>
									/agents/{agent.agentSlug}
								</Link>
							) : (
								<span className="text-content-secondary">
									Not assigned — ask admin to set a slug
								</span>
							)}
						</dd>
					</div>
					<div>
						<dt className="text-xs uppercase tracking-wide text-content-secondary">
							Territory
						</dt>
						<dd className="mt-1 text-sm text-content-primary">
							{agent.agentTerritory.length > 0
								? agent.agentTerritory.join(", ")
								: <span className="text-content-secondary">Not set</span>}
						</dd>
					</div>
					<div className="md:col-span-2">
						<dt className="text-xs uppercase tracking-wide text-content-secondary">
							Bio
						</dt>
						<dd className="mt-1 text-sm text-content-primary whitespace-pre-line">
							{agent.agentBio || (
								<span className="text-content-secondary">
									No bio yet. This is what renters will see — keep it short and
									personable.
								</span>
							)}
						</dd>
					</div>
				</dl>

				<div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
					Inline editing is coming soon. For now, ask an admin to update your
					photo, bio, slug, or territory via the admin console.
				</div>
			</div>
		</div>
	);
}
