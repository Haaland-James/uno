import Link from "next/link";
import { redirect } from "next/navigation";
import { Home, Users, Eye, MessageSquare, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAgent } from "@/lib/agent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
	const session = await requireAgent();
	if (!session) redirect("/agent/login");

	const agentId = session.user.id;
	const now = new Date();
	const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

	// Phase 1 scope: an in-house agent is the `landlord` on properties they
	// created on behalf of off-platform owners (listedByAgent=true). All
	// counts/queries below scope to that — admins viewing this page see
	// their own (empty) numbers, which is fine; admin oversight lives in
	// /admin/listings.
	const [
		myListingsByStatus,
		ownersCount,
		newListings7d,
		contacts7d,
		recentListings,
	] = await Promise.all([
		db.property.groupBy({
			by: ["status"],
			where: { landlordId: agentId, listedByAgent: true, deletedAt: null },
			_count: { _all: true },
		}),
		db.property.findMany({
			where: { landlordId: agentId, listedByAgent: true, deletedAt: null },
			select: { offPlatformOwnerPhone: true },
			distinct: ["offPlatformOwnerPhone"],
		}),
		db.property.count({
			where: {
				landlordId: agentId,
				listedByAgent: true,
				deletedAt: null,
				createdAt: { gte: weekAgo },
			},
		}),
		db.contactRequest.count({
			where: {
				property: { landlordId: agentId, listedByAgent: true },
				createdAt: { gte: weekAgo },
			},
		}),
		db.property.findMany({
			where: { landlordId: agentId, listedByAgent: true, deletedAt: null },
			orderBy: { createdAt: "desc" },
			take: 8,
			select: {
				id: true,
				title: true,
				city: true,
				area: true,
				status: true,
				offPlatformOwnerName: true,
				createdAt: true,
			},
		}),
	]);

	const byStatus = Object.fromEntries(
		myListingsByStatus.map((r) => [r.status, r._count._all])
	) as Record<string, number>;
	const totalListings = myListingsByStatus.reduce(
		(sum, r) => sum + r._count._all,
		0
	);
	const uniqueOwners = ownersCount.filter((o) => o.offPlatformOwnerPhone).length;
	const totalViews = 0; // TODO Phase 1.1: aggregate Property.views for agent's listings

	return (
		<div className="page-container py-4 md:py-6">
			<AdminPageHeader
				title={`Welcome, ${session.user.name?.split(" ")[0] ?? "Agent"}`}
				description="Your field operations snapshot — listings, owners, and renter contacts."
				actions={
					<Link
						href="/listing/properties/new"
						className="inline-flex items-center gap-2 rounded-md bg-uno-red px-3 py-2 text-sm font-semibold text-white hover:bg-uno-red-hover"
					>
						<Plus className="h-4 w-4" />
						New listing
					</Link>
				}
			/>

			<section className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
				<AdminStatCard
					label="My listings"
					value={totalListings}
					delta={`+${newListings7d} this week`}
					icon={<Home className="h-4 w-4" />}
					href="/agent/listings"
				/>
				<AdminStatCard
					label="Live"
					value={byStatus.ACTIVE ?? 0}
					icon={<Home className="h-4 w-4" />}
					href="/agent/listings"
				/>
				<AdminStatCard
					label="In review"
					value={byStatus.PENDING ?? 0}
					icon={<Home className="h-4 w-4" />}
					href="/agent/listings"
					tone={(byStatus.PENDING ?? 0) > 0 ? "warning" : "default"}
				/>
				<AdminStatCard
					label="Property owners"
					value={uniqueOwners}
					icon={<Users className="h-4 w-4" />}
					href="/agent/owners"
				/>

				<AdminStatCard
					label="Renter contacts (7d)"
					value={contacts7d}
					icon={<MessageSquare className="h-4 w-4" />}
				/>
				<AdminStatCard
					label="Total views"
					value={totalViews}
					icon={<Eye className="h-4 w-4" />}
				/>
				<AdminStatCard
					label="Rejected"
					value={byStatus.REJECTED ?? 0}
					icon={<Home className="h-4 w-4" />}
					tone={(byStatus.REJECTED ?? 0) > 0 ? "danger" : "default"}
				/>
				<AdminStatCard
					label="Drafts"
					value={byStatus.DRAFT ?? 0}
					icon={<Home className="h-4 w-4" />}
				/>
			</section>

			<section className="rounded-lg border border-black/10 bg-white p-4">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="text-sm font-semibold text-content-primary">
						Recent listings
					</h2>
					<Link
						href="/agent/listings"
						className="text-xs text-uno-red hover:underline"
					>
						View all
					</Link>
				</div>
				{recentListings.length === 0 ? (
					<div className="py-8 text-center">
						<p className="text-sm text-content-secondary mb-3">
							You haven&apos;t listed any properties yet.
						</p>
						<Link
							href="/listing/properties/new"
							className="inline-flex items-center gap-2 rounded-md bg-uno-red px-3 py-2 text-sm font-semibold text-white hover:bg-uno-red-hover"
						>
							<Plus className="h-4 w-4" />
							List your first property
						</Link>
					</div>
				) : (
					<ul className="divide-y divide-black/5 text-sm">
						{recentListings.map((p) => (
							<li
								key={p.id}
								className="flex items-center justify-between gap-3 py-2"
							>
								<Link
									href={`/property/${p.id}`}
									target="_blank"
									className="min-w-0 truncate text-content-primary hover:underline"
								>
									{p.title}
								</Link>
								<span className="text-xs text-content-secondary whitespace-nowrap">
									{p.offPlatformOwnerName ?? "—"} · {p.area || p.city}
								</span>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
