import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAgent } from "@/lib/agent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusPill, propertyStatusTone } from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function AgentListingsPage() {
	const session = await requireAgent();
	if (!session) redirect("/agent/login");

	const listings = await db.property.findMany({
		where: {
			landlordId: session.user.id,
			listedByAgent: true,
			deletedAt: null,
		},
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			title: true,
			city: true,
			area: true,
			status: true,
			rent: true,
			currency: true,
			offPlatformOwnerName: true,
			offPlatformOwnerPhone: true,
			views: true,
			contactCount: true,
			createdAt: true,
		},
	});

	return (
		<div className="page-container py-4 md:py-6">
			<AdminPageHeader
				title="My Listings"
				description="Properties you've listed on behalf of off-platform owners."
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

			{listings.length === 0 ? (
				<div className="rounded-lg border border-black/10 bg-white p-8 text-center">
					<p className="text-sm text-content-secondary mb-3">
						No listings yet. Go meet some landlords.
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
				<div className="rounded-lg border border-black/10 bg-white overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-content-secondary">
							<tr>
								<th className="px-4 py-3">Property</th>
								<th className="px-4 py-3">Owner</th>
								<th className="px-4 py-3">Location</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3 text-right">Views</th>
								<th className="px-4 py-3 text-right">Contacts</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-black/5">
							{listings.map((p) => (
								<tr key={p.id} className="hover:bg-black/[0.02]">
									<td className="px-4 py-3">
										<Link
											href={`/property/${p.id}`}
											target="_blank"
											className="font-medium text-content-primary hover:underline"
										>
											{p.title}
										</Link>
									</td>
									<td className="px-4 py-3 text-content-secondary">
										{p.offPlatformOwnerName ?? "—"}
										{p.offPlatformOwnerPhone && (
											<div className="text-xs">{p.offPlatformOwnerPhone}</div>
										)}
									</td>
									<td className="px-4 py-3 text-content-secondary">
										{p.area || p.city}
									</td>
									<td className="px-4 py-3">
										<StatusPill tone={propertyStatusTone(p.status)}>
											{p.status.toLowerCase()}
										</StatusPill>
									</td>
									<td className="px-4 py-3 text-right text-content-secondary">
										{p.views}
									</td>
									<td className="px-4 py-3 text-right text-content-secondary">
										{p.contactCount}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
