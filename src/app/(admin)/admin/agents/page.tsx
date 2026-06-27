"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShieldOff, ShieldCheck, ExternalLink, ArrowRight } from "lucide-react";
import { adminClient, type AdminAgentRow } from "@/lib/clients/admin";
import { toast } from "@/stores/toastStore";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTabs, type AdminTab } from "@/components/admin/AdminTabs";
import { AdminRow } from "@/components/admin/AdminRow";
import { AdminBtn } from "@/components/admin/AdminBtn";
import { StatusPill, type StatusTone } from "@/components/admin/StatusPill";
import { getInitials } from "@/lib/utils";
import { AGENT_SPECIALIZATION_LABELS as SPEC_LABELS } from "@/../config/constants";

type StatusFilter = "ALL" | "VERIFIED" | "SUSPENDED" | "PENDING";

const TABS: AdminTab<StatusFilter>[] = [
	{ key: "ALL", label: "All" },
	{ key: "VERIFIED", label: "Verified" },
	{ key: "SUSPENDED", label: "Suspended" },
	{ key: "PENDING", label: "Pending" },
];

function agentStatusTone(status: string): StatusTone {
	switch (status) {
		case "VERIFIED":
			return "success";
		case "SUSPENDED":
			return "danger";
		case "PENDING":
			return "warning";
		default:
			return "neutral";
	}
}

function useDebounce<T>(value: T, ms: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return debounced;
}

export default function AdminAgentsPage() {
	const [tab, setTab] = useState<StatusFilter>("ALL");
	const [q, setQ] = useState("");
	const [items, setItems] = useState<AdminAgentRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [busyId, setBusyId] = useState<string | null>(null);
	const debouncedQ = useDebounce(q, 250);

	useEffect(() => {
		let cancelled = false;
		setIsLoading(true);
		adminClient.agents
			.list({ status: tab, q: debouncedQ || undefined })
			.then((res) => {
				if (cancelled) return;
				setItems(res.items);
			})
			.catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
			.finally(() => !cancelled && setIsLoading(false));
		return () => {
			cancelled = true;
		};
	}, [tab, debouncedQ]);

	async function moderate(id: string, action: "suspend" | "reinstate") {
		setBusyId(id);
		try {
			await adminClient.agents.update(id, { action });
			toast.success(action === "suspend" ? "Agent suspended" : "Agent reinstated");
			setItems((prev) =>
				prev.map((a) =>
					a.id === id
						? { ...a, agentStatus: action === "suspend" ? "SUSPENDED" : "VERIFIED" }
						: a
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
				title="Agents"
				description="Manage in-house UNO field agents — their profiles, listings, and access. Promote a user to agent from the Users tab."
				actions={
					<Link
						href="/admin/users?role=RENTER"
						className="inline-flex items-center gap-2 rounded-md bg-uno-red px-3 py-2 text-sm font-semibold text-white hover:bg-uno-red-hover"
					>
						Add an agent
						<ArrowRight className="h-4 w-4" />
					</Link>
				}
			/>

			<AdminTabs tabs={TABS} value={tab} onChange={setTab} />

			<div className="mb-4 relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
				<input
					type="search"
					placeholder="Search by name, email, or slug…"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					className="h-10 w-full max-w-md rounded-md border border-black/10 bg-white pl-9 pr-3 text-sm focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red"
				/>
			</div>

			{isLoading ? (
				<p className="text-content-secondary">Loading…</p>
			) : items.length === 0 ? (
				<p className="text-content-secondary">No agents match this filter.</p>
			) : (
				<div className="space-y-3">
					{items.map((a) => (
						<AgentRow
							key={a.id}
							a={a}
							busy={busyId === a.id}
							onSuspend={() => {
								if (confirm(`Suspend ${a.name}? They will lose access to the agent console.`)) {
									moderate(a.id, "suspend");
								}
							}}
							onReinstate={() => moderate(a.id, "reinstate")}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function AgentRow({
	a,
	busy,
	onSuspend,
	onReinstate,
}: {
	a: AdminAgentRow;
	busy: boolean;
	onSuspend: () => void;
	onReinstate: () => void;
}) {
	const photo = a.agentPhoto || a.photo;
	const suspended = a.agentStatus === "SUSPENDED";
	return (
		<AdminRow
			thumbnail={
				<div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black/5 text-sm font-semibold text-content-secondary">
					{photo ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={photo} alt={a.name} className="h-full w-full object-cover" />
					) : (
						getInitials(a.name)
					)}
				</div>
			}
			title={
				<Link href={`/admin/agents/${a.id}`} className="hover:underline">
					{a.name}
				</Link>
			}
			subtitle={
				<>
					{a.email}
					{a.phone && <> · {a.phone}</>}
					{a.agentSlug && <> · /agents/{a.agentSlug}</>}
				</>
			}
			meta={
				<>
					{a._count.properties} listing{a._count.properties === 1 ? "" : "s"}
					{a.agentEmployment && <> · {a.agentEmployment === "IN_HOUSE" ? "In-house" : "External"}</>}
					{a.agentTerritory.length > 0 && <> · {a.agentTerritory.join(", ")}</>}
				</>
			}
			status={
				<>
					<StatusPill tone={agentStatusTone(a.agentStatus)}>{a.agentStatus}</StatusPill>
					{a.agentSpecializations.map((s) => (
						<StatusPill key={s} tone="neutral">
							{SPEC_LABELS[s] ?? s}
						</StatusPill>
					))}
				</>
			}
			actions={
				<>
					<Link
						href={`/admin/agents/${a.id}`}
						className="inline-flex items-center gap-1.5 rounded-md bg-uno-red px-3 py-1.5 text-sm font-medium text-white hover:bg-uno-red-hover"
					>
						Manage
						<ArrowRight className="h-4 w-4" />
					</Link>
					{a.agentSlug && (
						<a
							href={`/agents/${a.agentSlug}`}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-content-secondary hover:bg-black/5"
						>
							<ExternalLink className="h-4 w-4" />
							Profile
						</a>
					)}
					{suspended ? (
						<AdminBtn onClick={onReinstate} disabled={busy} tone="green" icon={<ShieldCheck className="h-4 w-4" />}>
							Reinstate
						</AdminBtn>
					) : (
						<AdminBtn onClick={onSuspend} disabled={busy} tone="gray" icon={<ShieldOff className="h-4 w-4" />}>
							Suspend
						</AdminBtn>
					)}
				</>
			}
		/>
	);
}
