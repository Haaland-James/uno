"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ImagePlus, Star, X, RotateCcw, Loader2, GripVertical } from "lucide-react";
import {
	DndContext,
	closestCenter,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	rectSortingStrategy,
	useSortable,
	arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useListPropertyStore } from "@/stores/listPropertyStore";
import { listingsClient } from "@/lib/clients/listings";
import { toast } from "@/stores/toastStore";
import { compressImage } from "@/lib/image-compress";

const MIN_PHOTOS = 5;
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

type Tile = {
	key: string;
	previewUrl: string;
	name: string;
	status: "uploading" | "done" | "error";
	url?: string; // Cloudinary secure_url (set when status === "done")
	file?: File; // kept for retry
};

// ─── Sortable tile wrapper ────────────────────────────────────────────────────

function SortableTile({
	tile,
	idx,
	isMain,
	onSetMain,
	onRemove,
	onRetry,
}: {
	tile: Tile;
	idx: number;
	isMain: boolean;
	onSetMain: () => void;
	onRemove: () => void;
	onRetry: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: tile.key, disabled: tile.status !== "done" });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 10 : undefined,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="group relative aspect-square overflow-hidden rounded-[14px] border border-black/10 bg-black/5"
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={tile.previewUrl}
				alt={`Upload ${idx + 1}`}
				className="absolute inset-0 h-full w-full object-cover"
			/>

			{/* Uploading veil */}
			{tile.status === "uploading" && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
					<Loader2 size={22} className="animate-spin" />
				</div>
			)}

			{/* Error state — tap to retry */}
			{tile.status === "error" && (
				<button
					type="button"
					onClick={onRetry}
					className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-white"
					aria-label="Retry upload"
				>
					<RotateCcw size={20} />
					<span className="text-[12px] font-medium">Tap to retry</span>
				</button>
			)}

			{/* Main badge / set-main button — always visible so touch works */}
			{tile.status === "done" && (
				isMain ? (
					<span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#af2525] px-2 py-0.5 text-[11px] font-semibold text-white">
						<Star size={10} fill="currentColor" /> Main
					</span>
				) : (
					<button
						type="button"
						onClick={onSetMain}
						className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-black opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
					>
						<Star size={10} /> Set main
					</button>
				)
			)}

			{/* Drag handle — only shown for done tiles; always visible so touch works */}
			{tile.status === "done" && (
				<button
					type="button"
					className="absolute bottom-2 left-2 flex h-6 w-6 cursor-grab items-center justify-center rounded-full bg-white/90 text-black active:cursor-grabbing opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
					aria-label="Drag to reorder"
					{...attributes}
					{...listeners}
				>
					<GripVertical size={13} />
				</button>
			)}

			{/* Remove */}
			<button
				type="button"
				onClick={onRemove}
				aria-label={`Remove photo ${idx + 1}`}
				className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-black hover:bg-white"
			>
				<X size={14} />
			</button>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PhotosStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);
	const inputRef = useRef<HTMLInputElement>(null);

	const [tiles, setTiles] = useState<Tile[]>(() =>
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
						? { ...t, status: "done", url: json.secure_url as string }
						: t
				)
			);
		} catch (e) {
			setTiles((prev) =>
				prev.map((t) =>
					t.key === tileKey ? { ...t, status: "error" } : t
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
				toast.error(`${file.name} is over 25 MB — please choose a smaller photo.`);
				continue;
			}
			const previewUrl = URL.createObjectURL(file);
			const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			newTiles.push({ key, previewUrl, name: file.name, status: "uploading", file });
		}
		if (newTiles.length === 0) return;
		setTiles((prev) => [...prev, ...newTiles]);
		newTiles.forEach((t) => { if (t.file) uploadOne(t.key, t.file); });
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

	// dnd-kit sensors — pointer for mouse/stylus, touch for mobile
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		setTiles((prev) => {
			const oldIdx = prev.findIndex((t) => t.key === active.id);
			const newIdx = prev.findIndex((t) => t.key === over.id);
			const reordered = arrayMove(prev, oldIdx, newIdx);
			const mainKey = prev[data.mainPhotoIndex]?.key;
			const newMainIdx = mainKey ? reordered.findIndex((t) => t.key === mainKey) : 0;
			if (newMainIdx !== data.mainPhotoIndex) {
				updateData({ mainPhotoIndex: Math.max(0, newMainIdx) });
			}
			return reordered;
		});
	};

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
						JPG or PNG, up to 25 MB each.
					</span>
				</button>
			) : (
				<div>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={tiles.map((t) => t.key)}
							strategy={rectSortingStrategy}
						>
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
								{tiles.map((t, idx) => (
									<SortableTile
										key={t.key}
										tile={t}
										idx={idx}
										isMain={data.mainPhotoIndex === idx}
										onSetMain={() => setMain(idx)}
										onRemove={() => removeTile(idx)}
										onRetry={() => retry(t.key)}
									/>
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
						</SortableContext>
					</DndContext>

					{remaining > 0 ? (
						<p className="mt-3 text-[13px] text-[#af2525]">
							Add {remaining} more photo{remaining === 1 ? "" : "s"} to continue.
						</p>
					) : stillUploading ? (
						<p className="mt-3 text-[13px] text-black/60">
							Uploading… you can continue once all photos finish.
						</p>
					) : (
						<p className="mt-3 text-[13px] text-black/50">
							Drag to reorder · Tap a photo to set it as the main cover.
						</p>
					)}
				</div>
			)}
		</div>
	);
}
