"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Eye, CircleX, CircleCheck, Trash2 } from "lucide-react";
import { toast } from "@/stores/toastStore";
import type { PropertyStatus } from "@prisma/client";

interface Props {
	id: string;
	status: PropertyStatus;
}

export function ListingActions({ id, status }: Props) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		if (!open) return;
		function handler(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	async function changeStatus(action: "pause" | "activate" | "mark_rented" | "mark_available") {
		setBusy(true);
		setOpen(false);
		try {
			const res = await fetch(`/api/properties/${id}/status`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ action }),
			});
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				throw new Error(json.error?.message ?? "Failed");
			}
			toast.success(
				action === "pause" ? "Listing taken off market" :
				action === "mark_rented" ? "Marked as rented" :
				action === "activate" ? "Listing re-listed" :
				"Marked as available"
			);
			router.refresh();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not update listing");
		} finally {
			setBusy(false);
		}
	}

	async function handleDelete() {
		setOpen(false);
		if (!confirm("Delete this listing? This cannot be undone.")) return;
		setBusy(true);
		try {
			const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				throw new Error(json.error?.message ?? "Failed");
			}
			toast.success("Listing deleted");
			router.refresh();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not delete listing");
		} finally {
			setBusy(false);
		}
	}

	const isOffMarket = status === "PAUSED";
	const isRented = status === "RENTED";

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen((v) => !v)}
				disabled={busy}
				className="flex h-8 w-8 items-center justify-center rounded-full text-content-secondary hover:bg-black/5 disabled:opacity-40"
			>
				<MoreHorizontal className="h-4 w-4" />
			</button>

			{open && (
				<div className="absolute right-0 top-9 z-30 w-48 rounded-xl border border-black/10 bg-white py-1 shadow-lg">
					{/* Edit Listing */}
					<a
						href={`/listing/properties/${id}/edit?returnTo=/agent/listings`}
						className="flex items-center gap-3 px-4 py-2.5 text-sm text-content-primary hover:bg-black/[0.04]"
					>
						<Pencil className="h-4 w-4 text-content-secondary" />
						Edit Listing
					</a>

					{/* Preview */}
					<a
						href={`/property/${id}`}
						target="_blank"
						rel="noreferrer"
						className="flex items-center gap-3 px-4 py-2.5 text-sm text-content-primary hover:bg-black/[0.04]"
						onClick={() => setOpen(false)}
					>
						<Eye className="h-4 w-4 text-content-secondary" />
						Preview
					</a>

					{/* Take off Market / Put back on Market */}
					{isOffMarket ? (
						<button
							onClick={() => changeStatus("activate")}
							className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-content-primary hover:bg-black/[0.04]"
						>
							<CircleX className="h-4 w-4 text-content-secondary" />
							Put back on Market
						</button>
					) : (
						<button
							onClick={() => changeStatus("pause")}
							disabled={isRented}
							className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-content-primary hover:bg-black/[0.04] disabled:opacity-40"
						>
							<CircleX className="h-4 w-4 text-content-secondary" />
							Take off Market
						</button>
					)}

					{/* Mark as Rented / Mark as Available */}
					{isRented ? (
						<button
							onClick={() => changeStatus("mark_available")}
							className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-content-primary hover:bg-black/[0.04]"
						>
							<CircleCheck className="h-4 w-4 text-content-secondary" />
							Mark as Available
						</button>
					) : (
						<button
							onClick={() => changeStatus("mark_rented")}
							className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-content-primary hover:bg-black/[0.04]"
						>
							<CircleCheck className="h-4 w-4 text-content-secondary" />
							Mark as Rented
						</button>
					)}

					<div className="my-1 border-t border-black/[0.06]" />

					{/* Delete Listing */}
					<button
						onClick={handleDelete}
						className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
					>
						<Trash2 className="h-4 w-4" />
						Delete Listing
					</button>
				</div>
			)}
		</div>
	);
}
