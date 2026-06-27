import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAgent } from "@/lib/agent";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusPill, propertyStatusTone } from "@/components/admin/StatusPill";
import { ListingActions } from "@/components/agent/ListingActions";
import { ListingsFilter } from "@/components/agent/ListingsFilter";
import type { PropertyStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function monthKey(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(key: string) {
	const [year, month] = key.split("-");
	return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-NG", {
		month: "long",
		year: "numeric",
	});
}

interface PageProps {
	searchParams: { state?: string; status?: string; month?: string };
}

export default async function AgentListingsPage({ searchParams }: PageProps) {
	const session = await requireAgent();
	if (!session) redirect("/agent/login");

	const { state, status, month } = searchParams;

	// Parse month filter into date range
	let createdAtFilter: { gte: Date; lt: Date } | undefined;
	if (month && /^\d{4}-\d{2}$/.test(month)) {
		const [y, m] = month.split("-").map(Number);
		createdAtFilter = {
			gte: new Date(y, m - 1, 1),
			lt: new Date(y, m, 1),
		};
	}

	// Fetch all listings (unfiltered) to build dropdown options
	const allListings = await db.property.findMany({
		where: { landlordId: session.user.id, deletedAt: null },
		select: { state: true, status: true, createdAt: true },
		orderBy: { createdAt: "desc" },
	});

	// Build filter option lists from the full dataset
	const stateSet = new Set<string>();
	const statusSet = new Set<string>();
	const monthSet = new Set<string>();
	for (const p of allListings) {
		if (p.state) stateSet.add(p.state);
		statusSet.add(p.status);
		monthSet.add(monthKey(new Date(p.createdAt)));
	}
	const states = Array.from(stateSet).sort();
	const statuses = Array.from(statusSet).sort();
	const months = Array.from(monthSet)
		.sort()
		.reverse()
		.map((v) => ({ value: v, label: formatMonth(v) }));

	// Fetch filtered listings
	const listings = await db.property.findMany({
		where: {
			landlordId: session.user.id,
			deletedAt: null,
			...(state && { state }),
			...(status && { status: status as PropertyStatus }),
			...(createdAtFilter && { createdAt: createdAtFilter }),
		},
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			title: true,
			state: true,
			city: true,
			area: true,
			status: true,
			rent: true,
			currency: true,
			offPlatformOwnerName: true,
			offPlatformOwnerPhone: true,
			views: true,
			contactCount: true,
			listedByAgent: true,
			createdAt: true,
		},
	});

	return (
		<div className="page-container py-4 md:py-6">
			<AdminPageHeader
				title="My Listings"
				description={`${allListings.length} total listing${allListings.length === 1 ? "" : "s"}`}
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

			<Suspense>
				<ListingsFilter states={states} statuses={statuses} months={months} />
			</Suspense>

			{listings.length === 0 ? (
				<div className="rounded-lg border border-black/10 bg-white p-8 text-center">
					{allListings.length === 0 ? (
						<>
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
						</>
					) : (
						<p className="text-sm text-content-secondary">
							No listings match the selected filters.
						</p>
					)}
				</div>
			) : (
				<div className="rounded-lg border border-black/10 bg-white overflow-hidden">
					<div className="px-4 py-2 text-xs text-content-secondary border-b border-black/5">
						Showing {listings.length} of {allListings.length} listing{allListings.length === 1 ? "" : "s"}
					</div>
					<table className="w-full text-sm">
						<thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-content-secondary">
							<tr>
								<th className="px-4 py-3">Property</th>
								<th className="px-4 py-3">Owner</th>
								<th className="px-4 py-3">Location</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3 text-right">Views</th>
								<th className="px-4 py-3 text-right">Contacts</th>
								<th className="px-4 py-3"></th>
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
										<div className="text-xs text-content-secondary">
											{new Date(p.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
										</div>
									</td>
									<td className="px-4 py-3 text-content-secondary">
										{p.listedByAgent ? (
											<>
												{p.offPlatformOwnerName ?? "—"}
												{p.offPlatformOwnerPhone && (
													<div className="text-xs">{p.offPlatformOwnerPhone}</div>
												)}
											</>
										) : (
											<span className="text-xs italic">Self-listed</span>
										)}
									</td>
									<td className="px-4 py-3 text-content-secondary">
										<div>{p.area || p.city}</div>
										{p.state && <div className="text-xs">{p.state}</div>}
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
									<td className="px-4 py-3">
										<ListingActions id={p.id} status={p.status} />
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
