"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Plus, X } from "lucide-react";
import { toast } from "@/stores/toastStore";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
	AGENT_SPECIALIZATION_LABELS as SPEC_LABELS,
	AGENT_SPECIALIZATIONS as ALL_SPECS,
} from "@/../config/constants";

interface Profile {
	name: string;
	email: string;
	photo: string | null;
	agentSlug: string | null;
	agentBio: string | null;
	agentPhoto: string | null;
	agentTerritory: string[];
	agentSpecializations: string[];
	agentVerifiedAt: string | null;
}

export default function AgentProfilePage() {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	// Form state
	const [bio, setBio] = useState("");
	const [photo, setPhoto] = useState("");
	const [territory, setTerritory] = useState<string[]>([]);
	const [territoryInput, setTerritoryInput] = useState("");
	const [specializations, setSpecializations] = useState<string[]>([]);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/agent/profile/me");
			if (!res.ok) throw new Error("Failed to load profile");
			const json = await res.json();
			const p: Profile = json.data;
			setProfile(p);
			setBio(p.agentBio ?? "");
			setPhoto(p.agentPhoto ?? "");
			setTerritory(p.agentTerritory ?? []);
			setSpecializations(p.agentSpecializations ?? []);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not load profile");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { load(); }, [load]);

	function addTerritory() {
		const val = territoryInput.trim();
		if (!val || territory.includes(val)) return;
		setTerritory((prev) => [...prev, val]);
		setTerritoryInput("");
	}

	function removeTerritory(t: string) {
		setTerritory((prev) => prev.filter((x) => x !== t));
	}

	function toggleSpec(s: string) {
		setSpecializations((prev) =>
			prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
		);
	}

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		try {
			const res = await fetch("/api/agent/profile", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ bio, photo, territory, specializations }),
			});
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				throw new Error(json.error?.message ?? "Failed to save");
			}
			toast.success("Profile updated");
			load();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save");
		} finally {
			setSaving(false);
		}
	}

	const displayPhoto = photo || profile?.photo || null;

	return (
		<div className="page-container py-4 md:py-6">
			<AdminPageHeader
				title="My Profile"
				description="How renters see you on UNO. Listed properties link back here."
				actions={
					profile?.agentSlug ? (
						<Link
							href={`/agents/${profile.agentSlug}`}
							target="_blank"
							className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-content-primary hover:bg-black/[0.02]"
						>
							<ExternalLink className="h-4 w-4" />
							View public profile
						</Link>
					) : null
				}
			/>

			{loading ? (
				<p className="text-sm text-content-secondary">Loading…</p>
			) : profile ? (
				<form onSubmit={handleSave} className="space-y-6">
					{/* Identity (read-only) */}
					<div className="rounded-lg border border-black/10 bg-white p-6">
						<div className="flex items-start gap-4">
							<div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-black/[0.05]">
								{displayPhoto ? (
									<Image
										src={displayPhoto}
										alt={profile.name}
										width={80}
										height={80}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-content-secondary">
										{profile.name?.[0]?.toUpperCase() ?? "?"}
									</div>
								)}
							</div>
							<div className="min-w-0 flex-1">
								<h2 className="text-lg font-semibold text-content-primary">{profile.name}</h2>
								<p className="text-sm text-content-secondary">{profile.email}</p>
								<div className="mt-2 flex flex-wrap items-center gap-1.5">
									<span className="inline-flex items-center gap-1.5 rounded-full bg-uno-red/10 px-2.5 py-0.5 text-xs font-semibold text-uno-red">
										UNO Verified Agent
									</span>
									{specializations.map((s) => (
										<span
											key={s}
											className="inline-flex items-center rounded-full bg-black/[0.05] px-2.5 py-0.5 text-xs font-medium text-content-secondary"
										>
											{SPEC_LABELS[s] ?? s}
										</span>
									))}
								</div>
								{profile.agentSlug && (
									<p className="mt-1 text-xs text-content-secondary">
										/agents/{profile.agentSlug}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Editable fields */}
					<div className="rounded-lg border border-black/10 bg-white p-6 space-y-5">
						<h3 className="text-sm font-semibold text-content-primary">Edit profile</h3>

						{/* Photo URL */}
						<div>
							<label className="mb-1 block text-xs font-medium text-content-secondary">
								Profile photo URL
							</label>
							<input
								type="url"
								value={photo}
								onChange={(e) => setPhoto(e.target.value)}
								placeholder="https://…"
								className="h-10 w-full rounded-md border border-black/15 px-3 text-sm focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red"
							/>
							<p className="mt-1 text-xs text-content-secondary">
								Paste a Cloudinary or image URL. Leave blank to use your account photo.
							</p>
						</div>

						{/* Bio */}
						<div>
							<label className="mb-1 block text-xs font-medium text-content-secondary">
								Bio <span className="font-normal">(max 600 characters)</span>
							</label>
							<textarea
								value={bio}
								onChange={(e) => setBio(e.target.value)}
								maxLength={600}
								rows={4}
								placeholder="A short intro renters will see on your profile…"
								className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red resize-none"
							/>
							<p className="mt-1 text-xs text-content-secondary text-right">
								{bio.length}/600
							</p>
						</div>

						{/* Territory */}
						<div>
							<label className="mb-1 block text-xs font-medium text-content-secondary">
								Territory
							</label>
							<div className="flex flex-wrap gap-1.5 mb-2">
								{territory.map((t) => (
									<span
										key={t}
										className="inline-flex items-center gap-1 rounded-full bg-black/[0.06] px-2.5 py-0.5 text-xs font-medium text-content-primary"
									>
										{t}
										<button
											type="button"
											onClick={() => removeTerritory(t)}
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
									onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTerritory(); } }}
									placeholder="Add area, e.g. Wuse 2"
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

						{/* Specializations */}
						<div>
							<label className="mb-2 block text-xs font-medium text-content-secondary">
								Specializations
							</label>
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
					</div>

					<div className="flex justify-end">
						<button
							type="submit"
							disabled={saving}
							className="rounded-md bg-uno-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-uno-red-hover disabled:opacity-60"
						>
							{saving ? "Saving…" : "Save profile"}
						</button>
					</div>
				</form>
			) : null}
		</div>
	);
}
