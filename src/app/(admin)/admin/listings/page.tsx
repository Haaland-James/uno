"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, XCircle, ShieldCheck, ShieldOff, Pause, Play, AlertTriangle } from "lucide-react";
import { adminClient, type AdminListingRow } from "@/lib/clients/admin";
import { toast } from "@/stores/toastStore";
import { cn } from "@/lib/utils";

type Tab =
	| "PENDING"
	| "VERIFY_REQUESTS"
	| "PENDING_AREAS"
	| "ACTIVE"
	| "REJECTED"
	| "ALL";

const TABS: { key: Tab; label: string }[] = [
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
			<h1 className="text-heading-2 text-content-primary mb-1">Admin · Listings</h1>
			<p className="text-small text-content-secondary mb-6">
				Approve, reject, and verify listings. Held items failed one or more auto-publish checks.
			</p>

			<div className="flex flex-wrap gap-2 mb-6 border-b border-black/5 pb-2">
				{TABS.map((t) => (
					<button
						key={t.key}
						onClick={() => setTab(t.key)}
						className={cn(
							"rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
							tab === t.key
								? "bg-uno-red text-white"
								: "bg-white text-content-secondary hover:bg-black/5"
						)}
					>
						{t.label}
					</button>
				))}
			</div>

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
						/>
					))}
				</div>
			)}
		</div>
	);
}

function ListingRow({
	p,
	busy,
	onAction,
}: {
	p: AdminListingRow;
	busy: boolean;
	onAction: (a: Parameters<typeof adminClient.moderate>[1]) => void;
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
		<div className="flex gap-4 rounded-lg border border-black/10 bg-white p-4">
			<div className="relative h-24 w-32 shrink-0 overflow-hidden rounded bg-black/5">
				{photo && <Image src={photo} alt={p.title} fill className="object-cover" sizes="128px" />}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<Link
							href={`/property/${p.id}`}
							target="_blank"
							className="font-medium text-content-primary hover:underline truncate block"
						>
							{p.title}
						</Link>
						<p className="text-small text-content-secondary truncate">
							{[p.streetAddress, p.area, p.city].filter(Boolean).join(", ")}
						</p>
						<p className="text-small text-content-secondary mt-1">
							₦{p.rent.toLocaleString()}/{p.rentPeriod.toLowerCase()} · {p.landlord.name} ·{" "}
							{p.landlord.phone ?? "no phone"}
						</p>
					</div>
					<div className="flex flex-col items-end gap-1 text-xs">
						<span
							className={cn(
								"rounded-full px-2 py-0.5 font-medium",
								isLive && "bg-green-100 text-green-700",
								isPending && "bg-amber-100 text-amber-700",
								p.status === "REJECTED" && "bg-red-100 text-red-700",
								isPaused && "bg-gray-200 text-gray-700"
							)}
						>
							{p.status}
						</span>
						{isVerified && (
							<span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 font-medium">
								✓ Verified
							</span>
						)}
						{verifyRequested && !isVerified && (
							<span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 font-medium">
								Verify requested
							</span>
						)}
					</div>
				</div>

				{failures.length > 0 && (
					<div className="mt-2 flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
						<AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
						<span>{failures.join(" · ")}</span>
					</div>
				)}
				{p.rejectionReason && (
					<p className="mt-2 text-xs text-red-700">Reason: {p.rejectionReason}</p>
				)}

				<div className="mt-3 flex flex-wrap gap-2">
					{isPending && (
						<>
							<Btn
								onClick={() => onAction({ action: "approve" })}
								disabled={busy}
								tone="green"
								icon={<CheckCircle2 className="h-4 w-4" />}
							>
								Approve
							</Btn>
							<Btn
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
							</Btn>
						</>
					)}
					{isLive && !isVerified && (
						<Btn
							onClick={() => onAction({ action: "verify" })}
							disabled={busy}
							tone="blue"
							icon={<ShieldCheck className="h-4 w-4" />}
						>
							Mark verified
						</Btn>
					)}
					{isLive && isVerified && (
						<Btn
							onClick={() => {
								const reason = prompt("Why remove the badge? (optional)");
								onAction({ action: "unverify", reason: reason ?? undefined });
							}}
							disabled={busy}
							tone="gray"
							icon={<ShieldOff className="h-4 w-4" />}
						>
							Unverify
						</Btn>
					)}
					{isLive && (
						<Btn
							onClick={() => onAction({ action: "pause" })}
							disabled={busy}
							tone="gray"
							icon={<Pause className="h-4 w-4" />}
						>
							Pause
						</Btn>
					)}
					{isPaused && (
						<Btn
							onClick={() => onAction({ action: "reactivate" })}
							disabled={busy}
							tone="green"
							icon={<Play className="h-4 w-4" />}
						>
							Reactivate
						</Btn>
					)}
				</div>
			</div>
		</div>
	);
}

function Btn({
	children,
	onClick,
	disabled,
	tone,
	icon,
}: {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
	tone: "green" | "red" | "blue" | "gray";
	icon?: React.ReactNode;
}) {
	const tones: Record<string, string> = {
		green: "bg-green-600 hover:bg-green-700 text-white",
		red: "bg-red-600 hover:bg-red-700 text-white",
		blue: "bg-blue-600 hover:bg-blue-700 text-white",
		gray: "bg-gray-200 hover:bg-gray-300 text-gray-800",
	};
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50",
				tones[tone]
			)}
		>
			{icon}
			{children}
		</button>
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
