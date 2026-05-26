import Link from "next/link";
import { redirect } from "next/navigation";
import {
	Home,
	Clock,
	ShieldCheck,
	MapPin,
	Users,
	UserPlus,
	MessageSquare,
	XCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { isAnyCanonicalLgaArea } from "@/lib/admin-stats";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
	// Layout already gates this; the second check here is so the typed return
	// from requireAdmin is non-null for the DB queries below.
	const admin = await requireAdmin();
	if (!admin) redirect("/admin/login");

	const now = new Date();
	const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

	const [
		listingsByStatus,
		verifyRequested,
		usersByRole,
		signups7d,
		newListings7d,
		contacts7d,
		pendingAreaCandidates,
		recentListings,
		recentSignups,
	] = await Promise.all([
		db.property.groupBy({
			by: ["status"],
			where: { deletedAt: null },
			_count: { _all: true },
		}),
		db.property.count({
			where: { deletedAt: null, verificationRequestedAt: { not: null } },
		}),
		db.user.groupBy({ by: ["role"], _count: { _all: true } }),
		db.user.count({ where: { createdAt: { gte: weekAgo } } }),
		db.property.count({
			where: { deletedAt: null, createdAt: { gte: weekAgo } },
		}),
		db.contactRequest.count({ where: { createdAt: { gte: weekAgo } } }),
		db.property.findMany({
			where: { deletedAt: null, status: { in: ["PENDING", "ACTIVE"] } },
			select: { id: true, lga: true, area: true },
			take: 500,
			orderBy: { createdAt: "desc" },
		}),
		db.property.findMany({
			where: { deletedAt: null, submittedAt: { not: null } },
			orderBy: { submittedAt: "desc" },
			take: 10,
			select: {
				id: true,
				title: true,
				city: true,
				area: true,
				status: true,
				submittedAt: true,
				landlord: { select: { name: true } },
			},
		}),
		db.user.findMany({
			orderBy: { createdAt: "desc" },
			take: 10,
			select: { id: true, name: true, email: true, role: true, createdAt: true },
		}),
	]);

	const byStatus = Object.fromEntries(
		listingsByStatus.map((r) => [r.status, r._count._all])
	) as Record<string, number>;
	const totalListings = listingsByStatus.reduce(
		(sum, r) => sum + r._count._all,
		0
	);
	const pendingArea = pendingAreaCandidates.filter(
		(p) => !isAnyCanonicalLgaArea(p.lga, p.area)
	).length;

	const byRole = Object.fromEntries(
		usersByRole.map((r) => [r.role, r._count._all])
	) as Record<string, number>;
	const totalUsers = usersByRole.reduce((sum, r) => sum + r._count._all, 0);

	return (
		<div className="page-container py-4 md:py-6">
			<AdminPageHeader
				title="Dashboard"
				description="Operational snapshot — listing pipeline, user growth, and recent activity."
			/>

			{/* KPI grid */}
			<section className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
				<AdminStatCard
					label="Total listings"
					value={totalListings}
					delta={`+${newListings7d} this week`}
					icon={<Home className="h-4 w-4" />}
					href="/admin/listings"
				/>
				<AdminStatCard
					label="Held for review"
					value={byStatus.PENDING ?? 0}
					icon={<Clock className="h-4 w-4" />}
					href="/admin/listings"
					tone={(byStatus.PENDING ?? 0) > 0 ? "warning" : "default"}
				/>
				<AdminStatCard
					label="Verify requested"
					value={verifyRequested}
					icon={<ShieldCheck className="h-4 w-4" />}
					href="/admin/listings"
					tone={verifyRequested > 0 ? "warning" : "default"}
				/>
				<AdminStatCard
					label="Pending areas"
					value={pendingArea}
					icon={<MapPin className="h-4 w-4" />}
					href="/admin/listings"
					tone={pendingArea > 0 ? "warning" : "default"}
				/>

				<AdminStatCard
					label="Total users"
					value={totalUsers}
					delta={`+${signups7d} this week`}
					icon={<Users className="h-4 w-4" />}
					href="/admin/users"
				/>
				<AdminStatCard
					label="Landlords"
					value={byRole.LANDLORD ?? 0}
					icon={<UserPlus className="h-4 w-4" />}
					href="/admin/users"
				/>
				<AdminStatCard
					label="Agents"
					value={byRole.AGENT ?? 0}
					icon={<UserPlus className="h-4 w-4" />}
					href="/admin/users"
				/>
				<AdminStatCard
					label="Contacts (7d)"
					value={contacts7d}
					icon={<MessageSquare className="h-4 w-4" />}
				/>
			</section>

			{/* Needs attention */}
			<section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<div className="rounded-lg border border-black/10 bg-white p-4">
					<h2 className="mb-3 text-sm font-semibold text-content-primary">
						Needs attention
					</h2>
					<ul className="divide-y divide-black/5 text-sm">
						<NeedsRow
							icon={<Clock className="h-4 w-4 text-amber-600" />}
							label="Held for review"
							count={byStatus.PENDING ?? 0}
							href="/admin/listings"
						/>
						<NeedsRow
							icon={<ShieldCheck className="h-4 w-4 text-blue-600" />}
							label="Verification requests"
							count={verifyRequested}
							href="/admin/listings"
						/>
						<NeedsRow
							icon={<MapPin className="h-4 w-4 text-amber-600" />}
							label="Listings in non-canonical areas"
							count={pendingArea}
							href="/admin/listings"
						/>
						<NeedsRow
							icon={<XCircle className="h-4 w-4 text-red-600" />}
							label="Rejected listings"
							count={byStatus.REJECTED ?? 0}
							href="/admin/listings"
						/>
					</ul>
				</div>

				<div className="rounded-lg border border-black/10 bg-white p-4">
					<h2 className="mb-3 text-sm font-semibold text-content-primary">
						Recently submitted
					</h2>
					{recentListings.length === 0 ? (
						<p className="text-sm text-content-secondary">No submissions yet.</p>
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
										{p.landlord.name} · {p.area || p.city}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="rounded-lg border border-black/10 bg-white p-4 lg:col-span-2">
					<h2 className="mb-3 text-sm font-semibold text-content-primary">
						New users
					</h2>
					{recentSignups.length === 0 ? (
						<p className="text-sm text-content-secondary">No signups yet.</p>
					) : (
						<ul className="divide-y divide-black/5 text-sm">
							{recentSignups.map((u) => (
								<li
									key={u.id}
									className="flex items-center justify-between gap-3 py-2"
								>
									<div className="min-w-0">
										<span className="text-content-primary truncate">
											{u.name}
										</span>
										<span className="ml-2 text-xs text-content-secondary">
											{u.email}
										</span>
									</div>
									<span className="text-xs text-content-secondary whitespace-nowrap">
										{u.role.toLowerCase()} ·{" "}
										{new Date(u.createdAt).toLocaleDateString("en-NG", {
											month: "short",
											day: "numeric",
										})}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</div>
	);
}

function NeedsRow({
	icon,
	label,
	count,
	href,
}: {
	icon: React.ReactNode;
	label: string;
	count: number;
	href: string;
}) {
	return (
		<li>
			<Link
				href={href}
				className="flex items-center justify-between gap-3 py-2 hover:bg-black/[0.02] rounded -mx-1 px-1"
			>
				<span className="flex items-center gap-2 text-content-primary">
					{icon}
					{label}
				</span>
				<span
					className={
						count > 0
							? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
							: "text-xs text-content-secondary"
					}
				>
					{count}
				</span>
			</Link>
		</li>
	);
}
