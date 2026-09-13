"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, X } from "lucide-react";
import Link from "next/link";
import { toast } from "@/stores/toastStore";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface Owner {
	name: string | null;
	phone: string;
	properties: { id: string; title: string; area: string; city: string }[];
}

export default function AgentOwnersPage() {
	const [owners, setOwners] = useState<Owner[]>([]);
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState<Owner | null>(null);
	const [editName, setEditName] = useState("");
	const [editPhone, setEditPhone] = useState("");
	const [saving, setSaving] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/agent/owners");
			if (!res.ok) throw new Error("Failed to load owners");
			const json = await res.json();
			setOwners(json.data ?? []);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not load owners");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { load(); }, [load]);

	function openEdit(owner: Owner) {
		setEditing(owner);
		setEditName(owner.name ?? "");
		setEditPhone(owner.phone);
	}

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!editing) return;
		setSaving(true);
		try {
			const res = await fetch("/api/agent/owners", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					currentPhone: editing.phone,
					name: editName,
					phone: editPhone,
				}),
			});
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				throw new Error(json.error?.message ?? "Failed to save");
			}
			toast.success("Owner updated");
			setEditing(null);
			load();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="page-container py-4 md:py-6">
			<AdminPageHeader
				title="Property Owners"
				description="Off-platform owners whose properties you manage on UNO. These contacts are never shown to renters."
			/>

			{loading ? (
				<p className="text-sm text-content-secondary">Loading…</p>
			) : owners.length === 0 ? (
				<div className="rounded-lg border border-black/10 bg-white p-8 text-center">
					<p className="text-sm text-content-secondary">
						No owners yet. Owners are added automatically when you create a listing
						with their contact details.
					</p>
				</div>
			) : (
				<div className="rounded-lg border border-black/10 bg-white overflow-hidden">
					<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-content-secondary">
							<tr>
								<th className="px-4 py-3">Owner</th>
								<th className="px-4 py-3">Phone</th>
								<th className="px-4 py-3 text-right">Listings</th>
								<th className="px-4 py-3">Properties</th>
								<th className="px-4 py-3"></th>
							</tr>
						</thead>
						<tbody className="divide-y divide-black/5">
							{owners.map((o) => (
								<tr key={o.phone} className="hover:bg-black/[0.02]">
									<td className="px-4 py-3 font-medium text-content-primary">
										{o.name ?? "Unnamed owner"}
									</td>
									<td className="px-4 py-3 text-content-secondary">
										<a href={`tel:${o.phone}`} className="hover:text-uno-red">
											{o.phone}
										</a>
									</td>
									<td className="px-4 py-3 text-right text-content-secondary">
										{o.properties.length}
									</td>
									<td className="px-4 py-3 text-content-secondary">
										<div className="flex flex-wrap gap-1">
											{o.properties.slice(0, 3).map((p) => (
												<Link
													key={p.id}
													href={`/property/${p.id}`}
													target="_blank"
													className="rounded bg-black/[0.04] px-2 py-0.5 text-xs hover:bg-black/10"
												>
													{p.area || p.city}
												</Link>
											))}
											{o.properties.length > 3 && (
												<span className="text-xs text-content-secondary">
													+{o.properties.length - 3} more
												</span>
											)}
										</div>
									</td>
									<td className="px-4 py-3">
										<button
											onClick={() => openEdit(o)}
											className="inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-xs font-medium text-content-secondary hover:bg-black/5"
										>
											<Pencil className="h-3 w-3" />
											Edit
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					</div>
				</div>
			)}

			{/* Edit modal */}
			{editing && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
					<div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-base font-semibold text-content-primary">Edit Owner</h2>
							<button
								onClick={() => setEditing(null)}
								className="flex h-8 w-8 items-center justify-center rounded-full text-content-secondary hover:bg-black/5"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
						<p className="mb-4 text-xs text-content-secondary">
							Changes apply to all {editing.properties.length} listing{editing.properties.length === 1 ? "" : "s"} linked to this owner.
						</p>
						<form onSubmit={handleSave} className="flex flex-col gap-3">
							<div>
								<label className="mb-1 block text-xs font-medium text-content-secondary">
									Owner name
								</label>
								<input
									type="text"
									required
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									className="h-10 w-full rounded-md border border-black/15 px-3 text-sm focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red"
								/>
							</div>
							<div>
								<label className="mb-1 block text-xs font-medium text-content-secondary">
									Phone number
								</label>
								<input
									type="tel"
									required
									value={editPhone}
									onChange={(e) => setEditPhone(e.target.value)}
									className="h-10 w-full rounded-md border border-black/15 px-3 text-sm focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red"
								/>
							</div>
							<div className="mt-2 flex justify-end gap-2">
								<button
									type="button"
									onClick={() => setEditing(null)}
									className="rounded-md border border-black/10 px-4 py-2 text-sm font-medium text-content-secondary hover:bg-black/5"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={saving}
									className="rounded-md bg-uno-red px-4 py-2 text-sm font-semibold text-white hover:bg-uno-red-hover disabled:opacity-60"
								>
									{saving ? "Saving…" : "Save changes"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
