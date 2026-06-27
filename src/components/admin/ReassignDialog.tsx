"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { adminClient, type AdminUserRow } from "@/lib/clients/admin";
import { toast } from "@/stores/toastStore";
import { AdminBtn } from "@/components/admin/AdminBtn";

/**
 * Modal for reassigning a listing to a different user (e.g. when an agent
 * leaves). Searches users by name/email/phone and PATCHes the listing's
 * landlordId via the admin properties endpoint.
 */
export function ReassignDialog({
	listingId,
	listingTitle,
	currentOwnerId,
	onClose,
	onDone,
}: {
	listingId: string;
	listingTitle: string;
	currentOwnerId?: string;
	onClose: () => void;
	onDone: () => void;
}) {
	const [q, setQ] = useState("");
	const [results, setResults] = useState<AdminUserRow[]>([]);
	const [searching, setSearching] = useState(false);
	const [busyId, setBusyId] = useState<string | null>(null);

	useEffect(() => {
		const term = q.trim();
		if (term.length < 2) {
			setResults([]);
			return;
		}
		let cancelled = false;
		setSearching(true);
		const t = setTimeout(() => {
			adminClient.users
				.list({ q: term })
				.then((res) => {
					if (!cancelled) {
						setResults(res.items.filter((u) => u.id !== currentOwnerId));
					}
				})
				.catch(() => {})
				.finally(() => !cancelled && setSearching(false));
		}, 250);
		return () => {
			cancelled = true;
			clearTimeout(t);
		};
	}, [q, currentOwnerId]);

	async function reassign(user: AdminUserRow) {
		setBusyId(user.id);
		try {
			await adminClient.moderate(listingId, { action: "reassign", landlordId: user.id });
			toast.success(`Reassigned to ${user.name}`);
			onDone();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to reassign");
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
			<button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/50" />
			<div className="relative z-10 w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
				<div className="mb-1 flex items-start justify-between gap-2">
					<h3 className="text-base font-semibold text-content-primary">Reassign listing</h3>
					<button type="button" onClick={onClose} className="rounded-md p-1 text-content-secondary hover:bg-black/5">
						<X className="h-5 w-5" />
					</button>
				</div>
				<p className="mb-3 truncate text-sm text-content-secondary">{listingTitle}</p>

				<div className="relative mb-3">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
					<input
						autoFocus
						type="search"
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Search users by name, email, or phone…"
						className="h-10 w-full rounded-md border border-black/15 pl-9 pr-3 text-sm focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red"
					/>
				</div>

				<div className="max-h-72 overflow-y-auto">
					{searching ? (
						<p className="py-3 text-sm text-content-secondary">Searching…</p>
					) : q.trim().length < 2 ? (
						<p className="py-3 text-sm text-content-secondary">Type at least 2 characters to search.</p>
					) : results.length === 0 ? (
						<p className="py-3 text-sm text-content-secondary">No matching users.</p>
					) : (
						<ul className="divide-y divide-black/5">
							{results.map((u) => (
								<li key={u.id} className="flex items-center justify-between gap-2 py-2">
									<div className="min-w-0">
										<div className="truncate font-medium text-content-primary">{u.name}</div>
										<div className="truncate text-xs text-content-secondary">{u.email}</div>
									</div>
									<AdminBtn onClick={() => reassign(u)} disabled={busyId === u.id} tone="brand">
										Assign
									</AdminBtn>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}
