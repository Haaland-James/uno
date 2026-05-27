import { notFound } from "next/navigation";
import Image from "next/image";
import { ShieldCheck, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { toCardDto } from "@/lib/property-mappers";
import { PropertyCard } from "@/components/property/PropertyCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

/**
 * Public agent profile page. Indexable (no auth gate via middleware
 * `/agents` allowlist). Phase 1 only renders in-house UNO agents — but
 * the query allows EXTERNAL too so the surface is ready for Phase 2.
 *
 * The framing is intentional: this profile sits *under* the UNO brand,
 * not as the agent's personal portfolio. Renters who land here are
 * meant to trust UNO first and the named agent second. That's why the
 * "UNO Verified Agent" badge is prominent and there is no agent-owned
 * branding (custom colours, logos) — Phase 2 may relax this for
 * external agencies.
 */

interface PageProps {
	params: { slug: string };
}

async function getAgent(slug: string) {
	const agent = await db.user.findUnique({
		where: { agentSlug: slug },
		select: {
			id: true,
			name: true,
			agentBio: true,
			agentPhoto: true,
			photo: true,
			agentTerritory: true,
			agentEmployment: true,
			agentStatus: true,
		},
	});
	if (!agent) return null;
	if (agent.agentStatus !== "VERIFIED") return null;
	return agent;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const agent = await getAgent(params.slug);
	if (!agent) return { title: "Agent not found · UNO" };
	const territory = agent.agentTerritory.join(", ");
	const desc = agent.agentBio
		? agent.agentBio.slice(0, 160)
		: `UNO Verified Agent${territory ? ` serving ${territory}` : ""}.`;
	return {
		title: `${agent.name} — UNO Verified Agent`,
		description: desc,
	};
}

export default async function AgentProfilePage({ params }: PageProps) {
	const agent = await getAgent(params.slug);
	if (!agent) notFound();

	const listings = await db.property.findMany({
		where: {
			landlordId: agent.id,
			listedByAgent: true,
			status: "ACTIVE",
			deletedAt: null,
		},
		include: { photos: { orderBy: { order: "asc" } } },
		orderBy: { createdAt: "desc" },
		take: 24,
	});

	const photo = agent.agentPhoto ?? agent.photo ?? null;

	return (
		<div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-10">
			{/* Hero */}
			<section className="rounded-[20px] border border-black/10 bg-white p-6 md:p-8">
				<div className="flex flex-col items-start gap-5 md:flex-row md:items-center">
					<div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-black/[0.05] md:h-28 md:w-28">
						{photo ? (
							<Image
								src={photo}
								alt={agent.name}
								width={112}
								height={112}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-black/50">
								{agent.name?.[0]?.toUpperCase() ?? "?"}
							</div>
						)}
					</div>
					<div className="min-w-0 flex-1">
						<div className="inline-flex items-center gap-1.5 rounded-full bg-uno-red/10 px-2.5 py-0.5 text-xs font-semibold text-uno-red">
							<ShieldCheck className="h-3.5 w-3.5" />
							UNO Verified Agent
						</div>
						<h1 className="mt-2 text-2xl font-semibold text-[#161515] md:text-3xl">
							{agent.name}
						</h1>
						{agent.agentTerritory.length > 0 && (
							<div className="mt-1 flex items-center gap-1.5 text-sm text-black/60">
								<MapPin className="h-4 w-4" />
								<span>{agent.agentTerritory.join(" · ")}</span>
							</div>
						)}
						{agent.agentBio && (
							<p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-black/75">
								{agent.agentBio}
							</p>
						)}
					</div>
				</div>
			</section>

			{/* Listings */}
			<section className="mt-8">
				<div className="mb-4 flex items-baseline justify-between">
					<h2 className="text-xl font-semibold text-[#161515]">
						{listings.length > 0
							? `Active listings (${listings.length})`
							: "Active listings"}
					</h2>
				</div>

				{listings.length === 0 ? (
					<div className="rounded-[15px] border border-black/10 bg-white p-8 text-center">
						<p className="text-sm text-black/60">
							No active listings right now. Check back soon — {agent.name.split(" ")[0]}{" "}
							is constantly sourcing new properties.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{listings.map((p) => (
							<PropertyCard
								key={p.id}
								data={toCardDto(p)}
								className="w-full md:w-full"
							/>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
