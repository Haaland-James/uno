"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, ShieldOff } from "lucide-react";
import { adminClient, type AdminUserRow } from "@/lib/clients/admin";
import { toast } from "@/stores/toastStore";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTabs, type AdminTab } from "@/components/admin/AdminTabs";
import { AdminRow } from "@/components/admin/AdminRow";
import { AdminBtn } from "@/components/admin/AdminBtn";
import { StatusPill, roleTone } from "@/components/admin/StatusPill";
import { getInitials } from "@/lib/utils";
import type { Role } from "@prisma/client";

type RoleFilter = "ALL" | Role;

const TABS: AdminTab<RoleFilter>[] = [
	{ key: "ALL", label: "All" },
	{ key: "RENTER", label: "Renters" },
	{ key: "LANDLORD", label: "Landlords" },
	{ key: "AGENT", label: "Agents" },
	{ key: "ADMIN", label: "Admins" },
];

export default function AdminUsersPage() {
	const [tab, setTab] = useState<RoleFilter>("ALL");
	const [q, setQ] = useState("");
	const [items, setItems] = useState<AdminUserRow[]>([]);
	const [total, setTotal] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [busyId, setBusyId] = useState<string | null>(null);

	// Debounce free-text query so we don't fire on every keystroke.
	const debouncedQ = useDebounce(q, 250);

	useEffect(() => {
		let cancelled = false;
		setIsLoading(true);
		adminClient.users
			.list({ role: tab, q: debouncedQ || undefined })
			.then((res) => {
				if (cancelled) return;
				setItems(res.items);
				setTotal(res.total);
			})
			.catch((e) =>
				toast.error(e instanceof Error ? e.message : "Failed to load")
			)
			.finally(() => !cancelled && setIsLoading(false));
		return () => {
			cancelled = true;
		};
	}, [tab, debouncedQ]);

	const tabsWithCount = useMemo<AdminTab<RoleFilter>[]>(() => {
		if (tab === "ALL") {
			return TABS.map((t) => (t.key === "ALL" ? { ...t, count: total } : t));
		}
		return TABS;
	}, [tab, total]);

	async function moderate(id: string, action: "promote" | "demote") {
		setBusyId(id);
		try {
			await adminClient.users.moderate(id, { action });
			toast.success(action === "promote" ? "Promoted to admin" : "Demoted to renter");
			// Optimistic local update — easier than a re-fetch and the row stays put.
			setItems((prev) =>
				prev.map((u) =>
					u.id === id
						? { ...u, role: action === "promote" ? "ADMIN" : "RENTER" }
						: u
				)
			);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed");
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div className="page-container py-4 md:py-6">
			<AdminPageHeader
				title="Users"
				description="Promote trusted operators to admin. Browse renters, landlords, and field agents."
			/>

			<AdminTabs tabs={tabsWithCount} value={tab} onChange={setTab} />

			<div className="mb-4 relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
				<input
					type="search"
					placeholder="Search by name, email, or phone…"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					className="h-10 w-full max-w-md rounded-md border border-black/10 bg-white pl-9 pr-3 text-sm focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red"
				/>
			</div>

			{isLoading ? (
				<p className="text-content-secondary">Loading…</p>
			) : items.length === 0 ? (
				<p className="text-content-secondary">No users match this filter.</p>
			) : (
				<div className="space-y-3">
					{items.map((u) => (
						<UserRow
							key={u.id}
							u={u}
							busy={busyId === u.id}
							onPromote={() => {
								if (
									confirm(
										`Promote ${u.name} (${u.email}) to ADMIN? They will gain full admin access.`
									)
								) {
									moderate(u.id, "promote");
								}
							}}
							onDemote={() => {
								if (
									confirm(
										`Demote ${u.name} (${u.email}) to RENTER? They will lose admin access.`
									)
								) {
									moderate(u.id, "demote");
								}
							}}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function UserRow({
	u,
	busy,
	onPromote,
	onDemote,
}: {
	u: AdminUserRow;
	busy: boolean;
	onPromote: () => void;
	onDemote: () => void;
}) {
	const isAdmin = u.role === "ADMIN";
	return (
		<AdminRow
			thumbnail={
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-sm font-semibold text-content-secondary">
					{getInitials(u.name)}
				</div>
			}
			title={u.name}
			subtitle={
				<>
					{u.email}
					{u.phone && <> · {u.phone}</>}
				</>
			}
			meta={
				<>
					{u._count.properties} listing{u._count.properties === 1 ? "" : "s"} ·{" "}
					{u._count.contactsSent} contacts sent · joined{" "}
					{new Date(u.createdAt).toLocaleDateString("en-NG", {
						month: "short",
						year: "numeric",
					})}
				</>
			}
			status={
				<>
					<StatusPill tone={roleTone(u.role)}>{u.role}</StatusPill>
					{!u.emailVerified && (
						<StatusPill tone="warning">Email unverified</StatusPill>
					)}
				</>
			}
			actions={
				<>
					{!isAdmin && (
						<AdminBtn
							onClick={onPromote}
							disabled={busy}
							tone="brand"
							icon={<ShieldCheck className="h-4 w-4" />}
						>
							Promote to admin
						</AdminBtn>
					)}
					{isAdmin && (
						<AdminBtn
							onClick={onDemote}
							disabled={busy}
							tone="gray"
							icon={<ShieldOff className="h-4 w-4" />}
						>
							Demote
						</AdminBtn>
					)}
					{u._count.properties > 0 && (
						<a
							href={`/admin/listings?landlordId=${u.id}`}
							className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-content-secondary hover:bg-black/5"
						>
							View listings
						</a>
					)}
				</>
			}
		/>
	);
}

function useDebounce<T>(value: T, ms: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return debounced;
}
