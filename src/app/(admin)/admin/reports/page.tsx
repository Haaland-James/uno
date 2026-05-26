import Link from "next/link";
import { Flag, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
	const admin = await requireAdmin();
	if (!admin) redirect("/admin/login");

	// Until the Report model ships, surface the closest existing signal:
	// listings that admins have rejected. Helps spot patterns (same landlord,
	// same area) without waiting on the new schema.
	const rejected = await db.property.findMany({
		where: { status: "REJECTED", deletedAt: null },
		orderBy: { updatedAt: "desc" },
		take: 25,
		select: {
			id: true,
			title: true,
			area: true,
			city: true,
			rejectionReason: true,
			updatedAt: true,
			landlord: { select: { name: true } },
		},
	});

	return (
		<div className="page-container py-4 md:py-6">
			<AdminPageHeader
				title="Reports"
				description="User-submitted reports against listings and accounts."
			/>

			<div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
				<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
				<div>
					<p className="text-sm font-medium text-amber-900">
						Reporting is coming soon
					</p>
					<p className="mt-1 text-sm text-amber-800">
						Once renters can flag a listing or message, those reports land here
						with status (Open / Dismissed / Actioned) and a one-click jump to the
						offending property. For now, see recently rejected listings below.
					</p>
				</div>
			</div>

			<section className="rounded-lg border border-black/10 bg-white p-4">
				<div className="mb-3 flex items-center gap-2">
					<Flag className="h-4 w-4 text-content-secondary" />
					<h2 className="text-sm font-semibold text-content-primary">
						Recently rejected listings
					</h2>
				</div>
				{rejected.length === 0 ? (
					<p className="text-sm text-content-secondary">
						No rejected listings yet.
					</p>
				) : (
					<ul className="divide-y divide-black/5 text-sm">
						{rejected.map((p) => (
							<li
								key={p.id}
								className="flex flex-col gap-1 py-2 md:flex-row md:items-center md:justify-between"
							>
								<div className="min-w-0">
									<Link
										href={`/property/${p.id}`}
										target="_blank"
										className="text-content-primary hover:underline"
									>
										{p.title}
									</Link>
									<div className="text-xs text-content-secondary truncate">
										{p.landlord.name} · {[p.area, p.city].filter(Boolean).join(", ")}
									</div>
								</div>
								<div className="text-xs text-red-700 md:max-w-[50%] md:text-right">
									{p.rejectionReason ?? "No reason recorded"}
								</div>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
