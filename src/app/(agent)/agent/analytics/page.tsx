import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAgent } from "@/lib/agent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { StatusPill, propertyStatusTone } from "@/components/admin/StatusPill";
import { Eye, Phone, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

function monthKey(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(key: string) {
	const [year, month] = key.split("-");
	return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-NG", {
		month: "short",
		year: "numeric",
	});
}

export default async function AgentAnalyticsPage() {
	const session = await requireAgent();
	if (!session) redirect("/agent/login");

	const agentId = session.user.id;
	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

	const [allListings, contacts6m] = await Promise.all([
		db.property.findMany({
			where: { landlordId: agentId, deletedAt: null },
			select: {
				id: true,
				title: true,
				city: true,
				area: true,
				status: true,
				views: true,
				contactCount: true,
				createdAt: true,
			},
			orderBy: { views: "desc" },
		}),
		db.contactRequest.findMany({
			where: {
				property: { landlordId: agentId },
				createdAt: { gte: sixMonthsAgo },
			},
			select: { createdAt: true },
		}),
	]);

	// Totals
	const totalViews = allListings.reduce((s, p) => s + p.views, 0);
	const totalContacts = allListings.reduce((s, p) => s + p.contactCount, 0);
	const views30d = allListings.reduce((s, p) => {
		// views aren't timestamped so we can't filter them — show total as proxy
		return s + p.views;
	}, 0);

	// Listings created per month (last 6 months)
	const listingsByMonth: Record<string, number> = {};
	for (let i = 5; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		listingsByMonth[monthKey(d)] = 0;
	}
	for (const p of allListings) {
		const key = monthKey(new Date(p.createdAt));
		if (key in listingsByMonth) listingsByMonth[key]++;
	}

	// Contacts per month (last 6 months)
	const contactsByMonth: Record<string, number> = {};
	for (const key of Object.keys(listingsByMonth)) contactsByMonth[key] = 0;
	for (const c of contacts6m) {
		const key = monthKey(new Date(c.createdAt));
		if (key in contactsByMonth) contactsByMonth[key]++;
	}

	// Top 10 by views
	const topListings = [...allListings].sort((a, b) => b.views - a.views).slice(0, 10);

	// Recent 30 days contacts
	const recentContacts = await db.contactRequest.count({
		where: {
			property: { landlordId: agentId },
			createdAt: { gte: thirtyDaysAgo },
		},
	});

	const months = Object.keys(listingsByMonth).sort();
	const maxListings = Math.max(...Object.values(listingsByMonth), 1);
	const maxContacts = Math.max(...Object.values(contactsByMonth), 1);

	return (
		<div className="page-container py-4 md:py-6 space-y-6">
			<AdminPageHeader
				title="Analytics"
				description="Performance overview for your listings."
			/>

			{/* Summary stats */}
			<section className="grid grid-cols-2 gap-3 md:grid-cols-4">
				<AdminStatCard
					label="Total views"
					value={totalViews}
					icon={<Eye className="h-4 w-4" />}
				/>
				<AdminStatCard
					label="Total contacts"
					value={totalContacts}
					icon={<Phone className="h-4 w-4" />}
				/>
				<AdminStatCard
					label="Contacts (30d)"
					value={recentContacts}
					icon={<TrendingUp className="h-4 w-4" />}
					tone={recentContacts > 0 ? "default" : "default"}
				/>
				<AdminStatCard
					label="Total listings"
					value={allListings.length}
					icon={<TrendingUp className="h-4 w-4" />}
				/>
			</section>

			{/* Monthly charts */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{/* New listings per month */}
				<div className="rounded-lg border border-black/10 bg-white p-4">
					<h2 className="mb-4 text-sm font-semibold text-content-primary">
						New listings — last 6 months
					</h2>
					<div className="flex items-end gap-2 h-32">
						{months.map((key) => {
							const val = listingsByMonth[key];
							const pct = Math.round((val / maxListings) * 100);
							return (
								<div key={key} className="flex flex-1 flex-col items-center gap-1">
									<span className="text-[10px] text-content-secondary">{val}</span>
									<div
										className="w-full rounded-t bg-uno-red/70"
										style={{ height: `${Math.max(pct, val > 0 ? 4 : 1)}%` }}
									/>
									<span className="text-[9px] text-content-secondary text-center leading-tight">
										{formatMonth(key)}
									</span>
								</div>
							);
						})}
					</div>
				</div>

				{/* Contacts per month */}
				<div className="rounded-lg border border-black/10 bg-white p-4">
					<h2 className="mb-4 text-sm font-semibold text-content-primary">
						Renter contacts — last 6 months
					</h2>
					<div className="flex items-end gap-2 h-32">
						{months.map((key) => {
							const val = contactsByMonth[key];
							const pct = Math.round((val / maxContacts) * 100);
							return (
								<div key={key} className="flex flex-1 flex-col items-center gap-1">
									<span className="text-[10px] text-content-secondary">{val}</span>
									<div
										className="w-full rounded-t bg-green-500/70"
										style={{ height: `${Math.max(pct, val > 0 ? 4 : 1)}%` }}
									/>
									<span className="text-[9px] text-content-secondary text-center leading-tight">
										{formatMonth(key)}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Top listings by views */}
			<div className="rounded-lg border border-black/10 bg-white overflow-hidden">
				<div className="px-4 py-3 border-b border-black/5">
					<h2 className="text-sm font-semibold text-content-primary">Top listings by views</h2>
				</div>
				{topListings.length === 0 ? (
					<p className="px-4 py-6 text-sm text-content-secondary text-center">No listings yet.</p>
				) : (
					<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-content-secondary">
							<tr>
								<th className="px-4 py-2">Property</th>
								<th className="px-4 py-2">Status</th>
								<th className="px-4 py-2 text-right">Views</th>
								<th className="px-4 py-2 text-right">Contacts</th>
								<th className="px-4 py-2 text-right">Conv %</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-black/5">
							{topListings.map((p) => {
								const conv = p.views > 0 ? ((p.contactCount / p.views) * 100).toFixed(1) : "—";
								return (
									<tr key={p.id} className="hover:bg-black/[0.02]">
										<td className="px-4 py-2">
											<a
												href={`/property/${p.id}`}
												target="_blank"
												className="font-medium text-content-primary hover:underline"
											>
												{p.title}
											</a>
											<div className="text-xs text-content-secondary">{p.area || p.city}</div>
										</td>
										<td className="px-4 py-2">
											<StatusPill tone={propertyStatusTone(p.status)}>
												{p.status.toLowerCase()}
											</StatusPill>
										</td>
										<td className="px-4 py-2 text-right text-content-secondary">{p.views}</td>
										<td className="px-4 py-2 text-right text-content-secondary">{p.contactCount}</td>
										<td className="px-4 py-2 text-right text-content-secondary">{conv}{conv !== "—" ? "%" : ""}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
					</div>
				)}
			</div>
		</div>
	);
}
