"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	ExternalLink,
	Plus,
	X,
	ShieldOff,
	ShieldCheck,
	Eye,
	Home,
	Users as UsersIcon,
	Pencil,
	ArrowRightLeft,
} from "lucide-react";
import {
	adminClient,
	type AdminAgentDetail,
	type AdminAgentListing,
} from "@/lib/clients/admin";
import { toast } from "@/stores/toastStore";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminBtn } from "@/components/admin/AdminBtn";
import { ReassignDialog } from "@/components/admin/ReassignDialog";
import { StatusPill, propertyStatusTone, type StatusTone } from "@/components/admin/StatusPill";
import { getInitials } from "@/lib/utils";
import {
	AGENT_SPECIALIZATION_LABELS as SPEC_LABELS,
	AGENT_SPECIALIZATIONS as ALL_SPECS,
} from "@/../config/constants";
import type { PropertyStatus } from "@prisma/client";

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

export default function AdminAgentDetailPage({ params }: { params: { id: string } }) {
	const { id } = params;
	const [data, setData] = useState<AdminAgentDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [reassignFor, setReassignFor] = useState<AdminAgentListing | null>(null);

	// Profile form state
	const [bio, setBio] = useState("");
	const [photo, setPhoto] = useState("");
	const [territory, setTerritory] = useState<string[]>([]);
	const [territoryInput, setTerritoryInput] = useState("");
	const [specializations, setSpecializations] = useState<string[]>([]);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await adminClient.agents.get(id);
			setData(res);
			setBio(res.agent.agentBio ?? "");
			setPhoto(res.agent.agentPhoto ?? "");
			setTerritory(res.agent.agentTerritory ?? []);
			setSpecializations(res.agent.agentSpecializations ?? []);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not load agent");
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		load();
	}, [load]);

	function addTerritory() {
		const val = territoryInput.trim();
		if (!val || territory.includes(val)) return;
		setTerritory((prev) => [...prev, val]);
		setTerritoryInput("");
	}

	function toggleSpec(s: string) {
		setSpecializations((prev) =>
			prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
		);
	}

	async function saveProfile(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		try {
			await adminClient.agents.update(id, {
				action: "updateProfile",
				bio,
				photo,
				territory,
				specializations: specializations as ("RENTALS" | "SALES" | "COMMERCIAL")[],
			});
			toast.success("Profile saved");
			load();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save");
		} finally {
			setBusy(false);
		}
	}

	async function setAccess(action: "suspend" | "reinstate") {
		setBusy(true);
		try {
			await adminClient.agents.update(id, { action });
			toast.success(action === "suspend" ? "Agent suspended" : "Agent reinstated");
			load();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed");
		} finally {
			setBusy(false);
		}
	}

	if (loading) {
		return (
			<div className="page-container py-6">
				<p className="text-content-secondary">Loading…</p>
			</div>
		);
	}
	if (!data) {
		return (
			<div className="page-container py-6">
				<p className="text-content-secondary">Agent not found.</p>
				<Link href="/admin/agents" className="text-uno-red hover:underline">
					Back to agents
				</Link>
			</div>
		);
	}

	const { agent, listings, owners, metrics } = data;
	const suspended = agent.agentStatus === "SUSPENDED";
	const displayPhoto = photo || agent.agentPhoto || agent.photo;

	return (
		<div className="page-container py-4 md:py-6">
			<Link
				href="/admin/agents"
				className="mb-3 inline-flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary"
			>
				<ArrowLeft className="h-4 w-4" />
				All agents
			</Link>

			<AdminPageHeader
				title={agent.name}
				description={
					<>
						{agent.email}
						{agent.phone && <> · {agent.phone}</>}
						{agent.agentSlug && <> · /agents/{agent.agentSlug}</>}
					</>
				}
				actions={
					<div className="flex items-center gap-2">
						<StatusPill tone={agentStatusTone(agent.agentStatus)}>
							{agent.agentStatus}
						</StatusPill>
						{agent.agentSlug && (
							<a
								href={`/agents/${agent.agentSlug}`}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-content-secondary hover:bg-black/5"
							>
								<ExternalLink className="h-4 w-4" />
								Public profile
							</a>
						)}
						{suspended ? (
							<AdminBtn onClick={() => setAccess("reinstate")} disabled={busy} tone="green" icon={<ShieldCheck className="h-4 w-4" />}>
								Reinstate
							</AdminBtn>
						) : (
							<AdminBtn
								onClick={() => {
									if (confirm(`Suspend ${agent.name}? They lose console access immediately.`)) {
										setAccess("suspend");
									}
								}}
								disabled={busy}
								tone="gray"
								icon={<ShieldOff className="h-4 w-4" />}
							>
								Suspend
							</AdminBtn>
						)}
					</div>
				}
			/>

			{/* Metrics */}
			<div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
				<AdminStatCard label="Listings" value={metrics.totalListings} icon={<Home className="h-4 w-4" />} />
				<AdminStatCard label="Active" value={metrics.activeListings} />
				<AdminStatCard label="Total views" value={metrics.totalViews} icon={<Eye className="h-4 w-4" />} />
				<AdminStatCard label="Contacts" value={metrics.totalContacts} icon={<UsersIcon className="h-4 w-4" />} />
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Profile editor */}
				<form onSubmit={saveProfile} className="lg:col-span-1 space-y-4">
					<div className="rounded-lg border border-black/10 bg-white p-5 space-y-5">
						<div className="flex items-center gap-3">
							<div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-black/5 text-base font-semibold text-content-secondary flex items-center justify-center">
								{displayPhoto ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={displayPhoto} alt={agent.name} className="h-full w-full object-cover" />
								) : (
									getInitials(agent.name)
								)}
							</div>
							<div className="min-w-0">
								<h3 className="text-sm font-semibold text-content-primary">Edit profile</h3>
								<p className="text-xs text-content-secondary">Shown on the public agent page.</p>
							</div>
						</div>

						<div>
							<label className="mb-1 block text-xs font-medium text-content-secondary">Profile photo URL</label>
							<input
								type="url"
								value={photo}
								onChange={(e) => setPhoto(e.target.value)}
								placeholder="https://…"
								className="h-10 w-full rounded-md border border-black/15 px-3 text-sm focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red"
							/>
						</div>

						<div>
							<label className="mb-1 block text-xs font-medium text-content-secondary">
								Bio <span className="font-normal">(max 600)</span>
							</label>
							<textarea
								value={bio}
								onChange={(e) => setBio(e.target.value)}
								maxLength={600}
								rows={4}
								placeholder="Short intro renters will see…"
								className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red resize-none"
							/>
							<p className="mt-1 text-right text-xs text-content-secondary">{bio.length}/600</p>
						</div>

						<div>
							<label className="mb-1 block text-xs font-medium text-content-secondary">Territory</label>
							<div className="mb-2 flex flex-wrap gap-1.5">
								{territory.map((t) => (
									<span
										key={t}
										className="inline-flex items-center gap-1 rounded-full bg-black/[0.06] px-2.5 py-0.5 text-xs font-medium text-content-primary"
									>
										{t}
										<button
											type="button"
											onClick={() => setTerritory((prev) => prev.filter((x) => x !== t))}
											className="ml-0.5 text-content-secondary hover:text-red-500"
										>
											<X className="h-3 w-3" />
										</button>
									</span>
								))}
							</div>
							<div className="flex gap-2">
								<input
									type="text"
									value={territoryInput}
									onChange={(e) => setTerritoryInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addTerritory();
										}
									}}
									placeholder="Add area, e.g. Uyo"
									className="h-9 flex-1 rounded-md border border-black/15 px-3 text-sm focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red"
								/>
								<button
									type="button"
									onClick={addTerritory}
									className="inline-flex items-center gap-1 rounded-md border border-black/15 px-3 text-sm font-medium text-content-secondary hover:bg-black/5"
								>
									<Plus className="h-3.5 w-3.5" />
									Add
								</button>
							</div>
						</div>

						<div>
							<label className="mb-2 block text-xs font-medium text-content-secondary">Specializations</label>
							<div className="flex flex-wrap gap-2">
								{ALL_SPECS.map((s) => (
									<button
										key={s}
										type="button"
										onClick={() => toggleSpec(s)}
										className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
											specializations.includes(s)
												? "border-uno-red bg-uno-red/10 text-uno-red"
												: "border-black/15 bg-white text-content-secondary hover:border-black/30"
										}`}
									>
										{SPEC_LABELS[s]}
									</button>
								))}
							</div>
						</div>

						<button
							type="submit"
							disabled={busy}
							className="w-full rounded-md bg-uno-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-uno-red-hover disabled:opacity-60"
						>
							{busy ? "Saving…" : "Save profile"}
						</button>
					</div>
				</form>

				{/* Listings + owners */}
				<div className="lg:col-span-2 space-y-6">
					<div className="rounded-lg border border-black/10 bg-white overflow-hidden">
						<div className="border-b border-black/5 px-4 py-3 text-sm font-semibold text-content-primary">
							Listings ({listings.length})
						</div>
						{listings.length === 0 ? (
							<p className="px-4 py-6 text-sm text-content-secondary">No listings yet.</p>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-content-secondary">
										<tr>
											<th className="px-4 py-2.5">Property</th>
											<th className="px-4 py-2.5">Status</th>
											<th className="px-4 py-2.5 text-right">Views</th>
											<th className="px-4 py-2.5"></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-black/5">
										{listings.map((l) => (
											<tr key={l.id} className="hover:bg-black/[0.02]">
												<td className="px-4 py-2.5">
													<Link
														href={`/property/${l.id}`}
														target="_blank"
														className="font-medium text-content-primary hover:underline"
													>
														{l.title}
													</Link>
													<div className="text-xs text-content-secondary">
														{[l.area, l.city].filter(Boolean).join(", ")}
													</div>
												</td>
												<td className="px-4 py-2.5">
													<StatusPill tone={propertyStatusTone(l.status as PropertyStatus)}>
														{l.status.toLowerCase()}
													</StatusPill>
												</td>
												<td className="px-4 py-2.5 text-right text-content-secondary">{l.views}</td>
												<td className="px-4 py-2.5">
													<div className="flex justify-end gap-1.5">
														<Link
															href={`/listing/properties/${l.id}/edit`}
															target="_blank"
															className="inline-flex items-center gap-1 rounded-md border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-content-secondary hover:bg-black/5"
														>
															<Pencil className="h-3.5 w-3.5" />
															Edit
														</Link>
														<button
															type="button"
															onClick={() => setReassignFor(l)}
															className="inline-flex items-center gap-1 rounded-md border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-content-secondary hover:bg-black/5"
														>
															<ArrowRightLeft className="h-3.5 w-3.5" />
															Reassign
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>

					{owners.length > 0 && (
						<div className="rounded-lg border border-black/10 bg-white overflow-hidden">
							<div className="border-b border-black/5 px-4 py-3 text-sm font-semibold text-content-primary">
								Off-platform owners ({owners.length})
							</div>
							<ul className="divide-y divide-black/5">
								{owners.map((o) => (
									<li key={o.phone} className="flex items-center justify-between px-4 py-2.5 text-sm">
										<div>
											<div className="font-medium text-content-primary">{o.name ?? "Unnamed owner"}</div>
											<div className="text-xs text-content-secondary">{o.phone}</div>
										</div>
										<span className="text-xs text-content-secondary">
											{o.count} listing{o.count === 1 ? "" : "s"}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</div>

			{reassignFor && (
				<ReassignDialog
					listingId={reassignFor.id}
					listingTitle={reassignFor.title}
					currentOwnerId={agent.id}
					onClose={() => setReassignFor(null)}
					onDone={() => {
						setReassignFor(null);
						load();
					}}
				/>
			)}
		</div>
	);
}
