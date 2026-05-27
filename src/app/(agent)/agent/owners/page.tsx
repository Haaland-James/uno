import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAgent } from "@/lib/agent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const dynamic = "force-dynamic";

/**
 * Off-platform owner directory. In Phase 1 we don't have a dedicated `Owner`
 * model — owners are inlined on Property rows via offPlatformOwnerName/Phone.
 * This page de-duplicates by phone and shows how many listings each owner has.
 *
 * If owner management gets richer (notes, visit history, payout tracking),
 * promote this into a real model. For now this view is enough.
 */
export default async function AgentOwnersPage() {
	const session = await requireAgent();
	if (!session) redirect("/agent/login");

	const properties = await db.property.findMany({
		where: {
			landlordId: session.user.id,
			listedByAgent: true,
			deletedAt: null,
			offPlatformOwnerPhone: { not: null },
		},
		select: {
			id: true,
			title: true,
			area: true,
			city: true,
			offPlatformOwnerName: true,
			offPlatformOwnerPhone: true,
		},
		orderBy: { createdAt: "desc" },
	});

	// Group by phone (the most stable identifier — names can have typos).
	const byPhone = new Map<
		string,
		{
			name: string | null;
			phone: string;
			properties: typeof properties;
		}
	>();
	for (const p of properties) {
		const phone = p.offPlatformOwnerPhone!;
		const existing = byPhone.get(phone);
		if (existing) {
			existing.properties.push(p);
			if (!existing.name && p.offPlatformOwnerName) {
				existing.name = p.offPlatformOwnerName;
			}
		} else {
			byPhone.set(phone, {
				name: p.offPlatformOwnerName,
				phone,
				properties: [p],
			});
		}
	}
	const owners = Array.from(byPhone.values()).sort(
		(a, b) => b.properties.length - a.properties.length
	);

	return (
		<div className="page-container py-4 md:py-6">
			<AdminPageHeader
				title="Property Owners"
				description="Off-platform owners whose properties you manage on UNO. These contacts are never shown to renters."
			/>

			{owners.length === 0 ? (
				<div className="rounded-lg border border-black/10 bg-white p-8 text-center">
					<p className="text-sm text-content-secondary">
						No owners yet. Owners are added automatically when you create a listing
						with their contact details.
					</p>
				</div>
			) : (
				<div className="rounded-lg border border-black/10 bg-white overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-content-secondary">
							<tr>
								<th className="px-4 py-3">Owner</th>
								<th className="px-4 py-3">Phone</th>
								<th className="px-4 py-3 text-right">Listings</th>
								<th className="px-4 py-3">Properties</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-black/5">
							{owners.map((o) => (
								<tr key={o.phone} className="hover:bg-black/[0.02]">
									<td className="px-4 py-3 font-medium text-content-primary">
										{o.name ?? "Unnamed owner"}
									</td>
									<td className="px-4 py-3 text-content-secondary">
										<a
											href={`tel:${o.phone}`}
											className="hover:text-uno-red"
										>
											{o.phone}
										</a>
									</td>
									<td className="px-4 py-3 text-right text-content-secondary">
										{o.properties.length}
									</td>
									<td className="px-4 py-3 text-content-secondary">
										<div className="flex flex-wrap gap-1">
											{o.properties.slice(0, 3).map((p) => (
												<Link
													key={p.id}
													href={`/property/${p.id}`}
													target="_blank"
													className="rounded bg-black/[0.04] px-2 py-0.5 text-xs hover:bg-black/10"
												>
													{p.area || p.city}
												</Link>
											))}
											{o.properties.length > 3 && (
												<span className="text-xs text-content-secondary">
													+{o.properties.length - 3} more
												</span>
											)}
										</div>
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
