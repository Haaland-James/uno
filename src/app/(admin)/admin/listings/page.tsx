"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
	CheckCircle2,
	XCircle,
	ShieldCheck,
	ShieldOff,
	Pause,
	Play,
	AlertTriangle,
	Pencil,
	ArrowRightLeft,
} from "lucide-react";
import { adminClient, type AdminListingRow } from "@/lib/clients/admin";
import { toast } from "@/stores/toastStore";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTabs, type AdminTab } from "@/components/admin/AdminTabs";
import { AdminRow } from "@/components/admin/AdminRow";
import { AdminBtn } from "@/components/admin/AdminBtn";
import { ReassignDialog } from "@/components/admin/ReassignDialog";
import { StatusPill, propertyStatusTone } from "@/components/admin/StatusPill";
import type { PropertyStatus } from "@prisma/client";

type Tab =
	| "PENDING"
	| "VERIFY_REQUESTS"
	| "PENDING_AREAS"
	| "ACTIVE"
	| "REJECTED"
	| "ALL";

const TABS: AdminTab<Tab>[] = [
	{ key: "PENDING", label: "Held for review" },
	{ key: "VERIFY_REQUESTS", label: "Verification requests" },
	{ key: "PENDING_AREAS", label: "Pending areas" },
	{ key: "ACTIVE", label: "Live" },
	{ key: "REJECTED", label: "Rejected" },
	{ key: "ALL", label: "All" },
];

export default function AdminListingsPage() {
	const [tab, setTab] = useState<Tab>("PENDING");
	const [items, setItems] = useState<AdminListingRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [reassignFor, setReassignFor] = useState<AdminListingRow | null>(null);

	const load = async (t: Tab) => {
		setIsLoading(true);
		try {
			const params =
				t === "VERIFY_REQUESTS"
					? { verifyRequested: true, status: "ALL" }
					: t === "PENDING_AREAS"
						? { pendingArea: true, status: "ALL" }
						: t === "ALL"
							? { status: "ALL" }
							: { status: t };
			const res = await adminClient.list(params);
			setItems(res.items);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to load");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		load(tab);
	}, [tab]);

	const moderate = async (
		id: string,
		action: Parameters<typeof adminClient.moderate>[1]
	) => {
		setBusyId(id);
		try {
			await adminClient.moderate(id, action);
			toast.success(actionLabel(action.action));
			setItems((prev) => prev.filter((i) => i.id !== id));
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed");
		} finally {
			setBusyId(null);
		}
	};

	return (
		<div className="page-container py-4 md:py-6">
			<AdminPageHeader
				title="Listings"
				description="Approve, reject, and verify listings. Held items failed one or more auto-publish checks."
			/>

			<AdminTabs tabs={TABS} value={tab} onChange={setTab} />

			{isLoading ? (
				<p className="text-content-secondary">Loading…</p>
			) : items.length === 0 ? (
				<p className="text-content-secondary">Nothing here.</p>
			) : (
				<div className="space-y-4">
					{items.map((p) => (
						<ListingRow
							key={p.id}
							p={p}
							busy={busyId === p.id}
							onAction={(a) => moderate(p.id, a)}
							onReassign={() => setReassignFor(p)}
						/>
					))}
				</div>
			)}

			{reassignFor && (
				<ReassignDialog
					listingId={reassignFor.id}
					listingTitle={reassignFor.title}
					currentOwnerId={reassignFor.landlord.id}
					onClose={() => setReassignFor(null)}
					onDone={() => {
						setReassignFor(null);
						load(tab);
					}}
				/>
			)}
		</div>
	);
}

function ListingRow({
	p,
	busy,
	onAction,
	onReassign,
}: {
	p: AdminListingRow;
	busy: boolean;
	onAction: (a: Parameters<typeof adminClient.moderate>[1]) => void;
	onReassign: () => void;
}) {
	const photo = p.photos[0]?.url;
	const failures = p.verificationSignals
		? Object.entries(p.verificationSignals)
				.filter(([, v]) => v !== "pass")
				.map(([k, v]) => `${k}: ${v}`)
		: [];

	const isPending = p.status === "PENDING";
	const isLive = p.status === "ACTIVE";
	const isPaused = p.status === "PAUSED";
	const verifyRequested = !!p.verificationRequestedAt;
	const isVerified = p.verificationStatus === "VERIFIED";

	return (
		<AdminRow
			thumbnail={
				<div className="relative h-24 w-32 overflow-hidden rounded bg-black/5">
					{photo && (
						<Image
							src={photo}
							alt={p.title}
							fill
							className="object-cover"
							sizes="128px"
						/>
					)}
				</div>
			}
			title={
				<Link
					href={`/property/${p.id}`}
					target="_blank"
					className="hover:underline"
				>
					{p.title}
				</Link>
			}
			subtitle={[p.streetAddress, p.area, p.city].filter(Boolean).join(", ")}
			meta={
				<>
					₦{p.rent.toLocaleString()}/{p.rentPeriod.toLowerCase()} · {p.landlord.name} ·{" "}
					{p.landlord.phone ?? "no phone"}
				</>
			}
			status={
				<>
					<StatusPill tone={propertyStatusTone(p.status as PropertyStatus)}>
						{p.status}
					</StatusPill>
					{isVerified && <StatusPill tone="verified">✓ Verified</StatusPill>}
					{verifyRequested && !isVerified && (
						<StatusPill tone="purple">Verify requested</StatusPill>
					)}
				</>
			}
			alert={
				<>
					{failures.length > 0 && (
						<div className="flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
							<AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
							<span>{failures.join(" · ")}</span>
						</div>
					)}
					{p.rejectionReason && (
						<p className="mt-2 text-xs text-red-700">Reason: {p.rejectionReason}</p>
					)}
				</>
			}
			actions={
				<>
					{isPending && (
						<>
							<AdminBtn
								onClick={() => onAction({ action: "approve" })}
								disabled={busy}
								tone="green"
								icon={<CheckCircle2 className="h-4 w-4" />}
							>
								Approve
							</AdminBtn>
							<AdminBtn
								onClick={() => {
									const reason = prompt("Reason for rejection?");
									if (reason && reason.trim().length >= 3) {
										onAction({ action: "reject", reason: reason.trim() });
									}
								}}
								disabled={busy}
								tone="red"
								icon={<XCircle className="h-4 w-4" />}
							>
								Reject
							</AdminBtn>
						</>
					)}
					{isLive && !isVerified && (
						<AdminBtn
							onClick={() => onAction({ action: "verify" })}
							disabled={busy}
							tone="blue"
							icon={<ShieldCheck className="h-4 w-4" />}
						>
							Mark verified
						</AdminBtn>
					)}
					{isLive && isVerified && (
						<AdminBtn
							onClick={() => {
								const reason = prompt("Why remove the badge? (optional)");
								onAction({ action: "unverify", reason: reason ?? undefined });
							}}
							disabled={busy}
							tone="gray"
							icon={<ShieldOff className="h-4 w-4" />}
						>
							Unverify
						</AdminBtn>
					)}
					{isLive && (
						<AdminBtn
							onClick={() => onAction({ action: "pause" })}
							disabled={busy}
							tone="gray"
							icon={<Pause className="h-4 w-4" />}
						>
							Pause
						</AdminBtn>
					)}
					{isPaused && (
						<AdminBtn
							onClick={() => onAction({ action: "reactivate" })}
							disabled={busy}
							tone="green"
							icon={<Play className="h-4 w-4" />}
						>
							Reactivate
						</AdminBtn>
					)}
					<Link
						href={`/listing/properties/${p.id}/edit`}
						target="_blank"
						className="inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-content-secondary hover:bg-black/5"
					>
						<Pencil className="h-4 w-4" />
						Edit
					</Link>
					<AdminBtn
						onClick={onReassign}
						disabled={busy}
						tone="gray"
						icon={<ArrowRightLeft className="h-4 w-4" />}
					>
						Reassign
					</AdminBtn>
				</>
			}
		/>
	);
}

function actionLabel(a: string) {
	switch (a) {
		case "approve":
			return "Listing approved";
		case "reject":
			return "Listing rejected";
		case "verify":
			return "Listing verified";
		case "unverify":
			return "Verification removed";
		case "pause":
			return "Listing paused";
		case "reactivate":
			return "Listing reactivated";
		default:
			return "Done";
	}
}
