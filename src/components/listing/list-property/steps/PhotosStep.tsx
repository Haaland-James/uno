"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ImagePlus, Star, X, RotateCcw, Loader2 } from "lucide-react";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import { listingsClient } from "@/lib/clients/listings";
import { toast } from "@/stores/toastStore";
import { compressImage } from "@/lib/image-compress";

const MIN_PHOTOS = 5;
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB — modern phones produce up to ~12MB raw

type Tile = {
	key: string;
	previewUrl: string;
	name: string;
	status: "uploading" | "done" | "error";
	url?: string; // Cloudinary secure_url (set when status === "done")
	progress?: number; // 0-1; not all browsers report it, used as best-effort
	file?: File; // kept for retry
};

export function PhotosStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);
	const inputRef = useRef<HTMLInputElement>(null);

	// Local upload state per tile. We render `tiles` (live uploads + done) above
	// any photoUrls already saved in the store from a prior session.
	const [tiles, setTiles] = useState<Tile[]>(() =>
		// Rehydrate from store: any photoUrls already persisted appear as "done" tiles
		// so the user can see and re-order them after returning to the wizard.
		data.photoUrls.map((url, i) => ({
			key: `persisted-${i}-${url}`,
			previewUrl: url,
			name: data.photoNames[i] ?? `photo-${i + 1}`,
			status: "done" as const,
			url,
		}))
	);

	// Revoke blob URLs on unmount to avoid leaks.
	useEffect(() => {
		return () => {
			tiles.forEach((t) => {
				if (t.previewUrl.startsWith("blob:")) URL.revokeObjectURL(t.previewUrl);
			});
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Sync confirmed Cloudinary URLs into the store whenever tiles change.
	useEffect(() => {
		const urls = tiles.filter((t) => t.status === "done" && t.url).map((t) => t.url!);
		const names = tiles.filter((t) => t.status === "done").map((t) => t.name);
		// Avoid noisy updates: only write if changed.
		if (
			urls.length !== data.photoUrls.length ||
			urls.some((u, i) => u !== data.photoUrls[i])
		) {
			updateData({ photoUrls: urls, photoNames: names });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tiles]);

	const uploadOne = useCallback(async (tileKey: string, file: File) => {
		try {
			// Compress before upload — a 10MB phone photo drops to ~500KB without
			// visible quality loss at listing-card sizes. Massive win on mobile uplinks.
			const compressed = await compressImage(file).catch(() => file);
			const sign = await listingsClient.signUpload();
			const form = new FormData();
			form.append("file", compressed);
			form.append("api_key", sign.apiKey);
			form.append("timestamp", String(sign.timestamp));
			form.append("signature", sign.signature);
			form.append("folder", sign.folder);

			const res = await fetch(
				`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
				{ method: "POST", body: form }
			);
			const json = await res.json();
			if (!res.ok || !json.secure_url) {
				throw new Error(json?.error?.message ?? "Upload failed");
			}

			setTiles((prev) =>
				prev.map((t) =>
					t.key === tileKey
						? { ...t, status: "done", url: json.secure_url as string, progress: 1 }
						: t
				)
			);
		} catch (e) {
			setTiles((prev) =>
				prev.map((t) =>
					t.key === tileKey ? { ...t, status: "error", progress: 0 } : t
				)
			);
			toast.error(e instanceof Error ? e.message : "Upload failed");
		}
	}, []);

	const handleFiles = (files: FileList | null) => {
		if (!files || files.length === 0) return;
		const newTiles: Tile[] = [];
		for (const file of Array.from(files)) {
			if (file.size > MAX_BYTES) {
				toast.error(`${file.name} is over 8MB — please choose a smaller photo.`);
				continue;
			}
			const previewUrl = URL.createObjectURL(file);
			const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			newTiles.push({
				key,
				previewUrl,
				name: file.name,
				status: "uploading",
				file,
			});
		}
		if (newTiles.length === 0) return;
		setTiles((prev) => [...prev, ...newTiles]);
		newTiles.forEach((t) => {
			if (t.file) uploadOne(t.key, t.file);
		});
	};

	const retry = (tileKey: string) => {
		const tile = tiles.find((t) => t.key === tileKey);
		if (!tile?.file) return;
		setTiles((prev) =>
			prev.map((t) => (t.key === tileKey ? { ...t, status: "uploading" } : t))
		);
		uploadOne(tileKey, tile.file);
	};

	const removeTile = (idx: number) => {
		const tile = tiles[idx];
		if (tile.previewUrl.startsWith("blob:")) URL.revokeObjectURL(tile.previewUrl);
		const next = tiles.filter((_, i) => i !== idx);
		setTiles(next);
		const nextMain =
			data.mainPhotoIndex === idx
				? 0
				: data.mainPhotoIndex > idx
					? data.mainPhotoIndex - 1
					: data.mainPhotoIndex;
		updateData({ mainPhotoIndex: nextMain });
	};

	const setMain = (idx: number) => updateData({ mainPhotoIndex: idx });

	const doneCount = tiles.filter((t) => t.status === "done").length;
	const remaining = Math.max(0, MIN_PHOTOS - doneCount);
	const stillUploading = tiles.some((t) => t.status === "uploading");

	return (
		<div>
			<h1 className="mb-2 text-[22px] font-semibold text-black">
				Add some photos of your property.
			</h1>
			<p className="mb-6 text-[14px] text-black/60">
				Help people picture themselves in your property. A minimum of {MIN_PHOTOS}{" "}
				photos is required for a quality listing.
			</p>

			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				multiple
				className="hidden"
				onChange={(e) => {
					handleFiles(e.target.files);
					if (inputRef.current) inputRef.current.value = "";
				}}
			/>

			{tiles.length === 0 ? (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="flex w-full flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-black/20 bg-white px-6 py-10 text-center hover:border-[#af2525]"
				>
					<ImagePlus size={36} className="text-black/40" />
					<span className="inline-flex h-[40px] items-center justify-center rounded-[50px] bg-[#af2525] px-5 text-[14px] font-semibold text-white">
						Add photos
					</span>
					<span className="text-[12px] text-black/50">
						JPG or PNG, up to 8MB each.
					</span>
				</button>
			) : (
				<div>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{tiles.map((t, idx) => (
							<div
								key={t.key}
								className="group relative aspect-square overflow-hidden rounded-[14px] border border-black/10 bg-black/5"
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={t.previewUrl}
									alt={`Upload ${idx + 1}`}
									className="absolute inset-0 h-full w-full object-cover"
								/>

								{/* Uploading veil */}
								{t.status === "uploading" && (
									<div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
										<Loader2 size={22} className="animate-spin" />
									</div>
								)}

								{/* Error state — tap to retry */}
								{t.status === "error" && (
									<button
										type="button"
										onClick={() => retry(t.key)}
										className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-white"
										aria-label="Retry upload"
									>
										<RotateCcw size={20} />
										<span className="text-[12px] font-medium">Tap to retry</span>
									</button>
								)}

								{/* Main badge / set-main button */}
								{t.status === "done" && data.mainPhotoIndex === idx ? (
									<span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#af2525] px-2 py-0.5 text-[11px] font-semibold text-white">
										<Star size={10} fill="currentColor" /> Main
									</span>
								) : t.status === "done" ? (
									<button
										type="button"
										onClick={() => setMain(idx)}
										className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-black sm:hidden sm:group-hover:inline-flex md:hidden md:group-hover:inline-flex"
									>
										<Star size={10} /> Set main
									</button>
								) : null}

								{/* Remove */}
								<button
									type="button"
									onClick={() => removeTile(idx)}
									aria-label={`Remove photo ${idx + 1}`}
									className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-black hover:bg-white"
								>
									<X size={14} />
								</button>
							</div>
						))}

						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							className="flex aspect-square items-center justify-center rounded-[14px] border border-dashed border-black/20 text-black/50 hover:border-[#af2525] hover:text-[#af2525]"
							aria-label="Add more photos"
						>
							<ImagePlus size={24} />
						</button>
					</div>

					{remaining > 0 ? (
						<p className="mt-3 text-[13px] text-[#af2525]">
							Add {remaining} more photo{remaining === 1 ? "" : "s"} to continue.
						</p>
					) : stillUploading ? (
						<p className="mt-3 text-[13px] text-black/60">
							Uploading… you can continue once all photos finish.
						</p>
					) : null}
				</div>
			)}
		</div>
	);
}
