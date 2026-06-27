"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, RotateCcw, ExternalLink } from "lucide-react";
import { adminClient, type AdminReportRow } from "@/lib/clients/admin";
import { toast } from "@/stores/toastStore";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTabs, type AdminTab } from "@/components/admin/AdminTabs";
import { AdminRow } from "@/components/admin/AdminRow";
import { AdminBtn } from "@/components/admin/AdminBtn";
import { StatusPill, propertyStatusTone, type StatusTone } from "@/components/admin/StatusPill";
import type { PropertyStatus } from "@prisma/client";

type StatusFilter = "OPEN" | "RESOLVED" | "DISMISSED" | "ALL";

const REASON_LABELS: Record<string, string> = {
	SCAM: "Suspected scam",
	INACCURATE: "Inaccurate details",
	UNAVAILABLE: "No longer available",
	DUPLICATE: "Duplicate listing",
	OFFENSIVE: "Offensive content",
	OTHER: "Other",
};

function reasonTone(reason: string): StatusTone {
	switch (reason) {
		case "SCAM":
		case "OFFENSIVE":
			return "danger";
		case "INACCURATE":
		case "UNAVAILABLE":
			return "warning";
		default:
			return "neutral";
	}
}

function reportStatusTone(status: string): StatusTone {
	switch (status) {
		case "OPEN":
			return "warning";
		case "RESOLVED":
			return "success";
		case "DISMISSED":
			return "neutral";
		default:
			return "neutral";
	}
}

export default function AdminReportsPage() {
	const [tab, setTab] = useState<StatusFilter>("OPEN");
	const [items, setItems] = useState<AdminReportRow[]>([]);
	const [counts, setCounts] = useState({ OPEN: 0, RESOLVED: 0, DISMISSED: 0 });
	const [isLoading, setIsLoading] = useState(true);
	const [busyId, setBusyId] = useState<string | null>(null);

	async function load(t: StatusFilter) {
		setIsLoading(true);
		try {
			const res = await adminClient.reports.list({ status: t });
			setItems(res.items);
			setCounts(res.counts);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to load");
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		load(tab);
	}, [tab]);

	const tabs: AdminTab<StatusFilter>[] = [
		{ key: "OPEN", label: "Open", count: counts.OPEN },
		{ key: "RESOLVED", label: "Resolved", count: counts.RESOLVED },
		{ key: "DISMISSED", label: "Dismissed", count: counts.DISMISSED },
		{ key: "ALL", label: "All" },
	];

	async function moderate(
		id: string,
		action: Parameters<typeof adminClient.reports.moderate>[1]
	) {
		setBusyId(id);
		try {
			await adminClient.reports.moderate(id, action);
			toast.success(
				action.action === "resolve"
					? "Report resolved"
					: action.action === "dismiss"
						? "Report dismissed"
						: "Report reopened"
			);
			// Drop from the current view unless we're on the ALL tab.
			if (tab !== "ALL") {
				setItems((prev) => prev.filter((r) => r.id !== id));
			} else {
				load("ALL");
			}
			// Refresh tab counts.
			adminClient.reports.list({ status: tab }).then((res) => setCounts(res.counts)).catch(() => {});
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed");
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div className="page-container py-4 md:py-6">
			<AdminPageHeader
				title="Reports"
				description="Listings flagged by renters and guests. Resolve to action, dismiss if unfounded."
			/>

			<AdminTabs tabs={tabs} value={tab} onChange={setTab} />

			{isLoading ? (
				<p className="text-content-secondary">Loading…</p>
			) : items.length === 0 ? (
				<p className="text-content-secondary">No reports here.</p>
			) : (
				<div className="space-y-3">
					{items.map((r) => (
						<ReportRow key={r.id} r={r} busy={busyId === r.id} onAction={(a) => moderate(r.id, a)} />
					))}
				</div>
			)}
		</div>
	);
}

function ReportRow({
	r,
	busy,
	onAction,
}: {
	r: AdminReportRow;
	busy: boolean;
	onAction: (a: Parameters<typeof adminClient.reports.moderate>[1]) => void;
}) {
	const isOpen = r.status === "OPEN";
	return (
		<AdminRow
			title={
				<span className="flex items-center gap-2">
					<StatusPill tone={reasonTone(r.reason)}>{REASON_LABELS[r.reason] ?? r.reason}</StatusPill>
					<Link href={`/property/${r.property.id}`} target="_blank" className="hover:underline">
						{r.property.title}
					</Link>
				</span>
			}
			subtitle={
				<>
					{[r.property.area, r.property.city].filter(Boolean).join(", ")} · Listed by{" "}
					{r.property.landlord.name}
				</>
			}
			meta={
				<>
					Reported by {r.reporter ? `${r.reporter.name} (${r.reporter.email})` : "a guest"} ·{" "}
					{new Date(r.createdAt).toLocaleDateString("en-NG", {
						day: "numeric",
						month: "short",
						year: "numeric",
					})}
				</>
			}
			status={
				<>
					<StatusPill tone={reportStatusTone(r.status)}>{r.status}</StatusPill>
					<StatusPill tone={propertyStatusTone(r.property.status as PropertyStatus)}>
						{r.property.status}
					</StatusPill>
				</>
			}
			alert={
				<>
					{r.details && (
						<p className="rounded bg-black/[0.03] px-2.5 py-1.5 text-xs text-content-secondary">
							“{r.details}”
						</p>
					)}
					{r.resolution && (
						<p className="mt-1 text-xs text-content-secondary">Note: {r.resolution}</p>
					)}
				</>
			}
			actions={
				<>
					<Link
						href={`/property/${r.property.id}`}
						target="_blank"
						className="inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-content-secondary hover:bg-black/5"
					>
						<ExternalLink className="h-4 w-4" />
						View listing
					</Link>
					{isOpen && (
						<>
							<AdminBtn
								onClick={() => {
									const pauseListing = confirm(
										"Resolve this report.\n\nOK = also PAUSE the listing.\nCancel = resolve without pausing."
									);
									const note = prompt("Resolution note (optional)") ?? undefined;
									onAction({ action: "resolve", pauseListing, note });
								}}
								disabled={busy}
								tone="green"
								icon={<CheckCircle2 className="h-4 w-4" />}
							>
								Resolve
							</AdminBtn>
							<AdminBtn
								onClick={() => onAction({ action: "dismiss" })}
								disabled={busy}
								tone="gray"
								icon={<XCircle className="h-4 w-4" />}
							>
								Dismiss
							</AdminBtn>
						</>
					)}
					{!isOpen && (
						<AdminBtn
							onClick={() => onAction({ action: "reopen" })}
							disabled={busy}
							tone="gray"
							icon={<RotateCcw className="h-4 w-4" />}
						>
							Reopen
						</AdminBtn>
					)}
				</>
			}
		/>
	);
}
