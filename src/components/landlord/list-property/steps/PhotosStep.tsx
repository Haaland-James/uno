"use client";

import { useRef, useState, useEffect } from "react";
import { ImagePlus, Star, X } from "lucide-react";
import { useListPropertyStore } from "@/stores/listPropertyStore";

const MIN_PHOTOS = 5;

export function PhotosStep() {
	const data = useListPropertyStore((s) => s.data);
	const updateData = useListPropertyStore((s) => s.updateData);
	const inputRef = useRef<HTMLInputElement>(null);
	const [previews, setPreviews] = useState<string[]>([]);

	// Rebuild previews when photoNames length changes (after refresh, photos are gone)
	useEffect(() => {
		return () => {
			previews.forEach((url) => URL.revokeObjectURL(url));
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleFiles = (files: FileList | null) => {
		if (!files || files.length === 0) return;
		const newUrls = Array.from(files).map((f) => URL.createObjectURL(f));
		const newNames = Array.from(files).map((f) => f.name);
		setPreviews((prev) => [...prev, ...newUrls]);
		updateData({ photoNames: [...data.photoNames, ...newNames] });
	};

	const removePhoto = (idx: number) => {
		const url = previews[idx];
		if (url) URL.revokeObjectURL(url);
		setPreviews((prev) => prev.filter((_, i) => i !== idx));
		const nextNames = data.photoNames.filter((_, i) => i !== idx);
		const nextMain =
			data.mainPhotoIndex === idx
				? 0
				: data.mainPhotoIndex > idx
					? data.mainPhotoIndex - 1
					: data.mainPhotoIndex;
		updateData({ photoNames: nextNames, mainPhotoIndex: nextMain });
	};

	const setMain = (idx: number) => updateData({ mainPhotoIndex: idx });

	const remaining = Math.max(0, MIN_PHOTOS - data.photoNames.length);

	return (
		<div>
			<h1 className="mb-2 text-[22px] font-semibold text-black">
				Add some photos of your property.
			</h1>
			<p className="mb-6 text-[14px] text-black/60">
				Help people picture themselves in your property. A minimum of{" "}
				{MIN_PHOTOS} photos is required for a quality listing.
			</p>

			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				multiple
				className="hidden"
				onChange={(e) => handleFiles(e.target.files)}
			/>

			{previews.length === 0 ? (
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
						JPG or PNG, up to 5MB each.
					</span>
				</button>
			) : (
				<div>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{previews.map((url, idx) => (
							<div
								key={url}
								className="group relative aspect-square overflow-hidden rounded-[14px] border border-black/10 bg-black/5"
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={url}
									alt={`Upload ${idx + 1}`}
									className="absolute inset-0 h-full w-full object-cover"
								/>
								{data.mainPhotoIndex === idx ? (
									<span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#af2525] px-2 py-0.5 text-[11px] font-semibold text-white">
										<Star size={10} fill="currentColor" /> Main
									</span>
								) : (
									<button
										type="button"
										onClick={() => setMain(idx)}
										className="absolute left-2 top-2 hidden items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-black group-hover:inline-flex"
									>
										<Star size={10} /> Set main
									</button>
								)}
								<button
									type="button"
									onClick={() => removePhoto(idx)}
									aria-label={`Remove photo ${idx + 1}`}
									className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-black hover:bg-white"
								>
									<X size={12} />
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
					) : null}
				</div>
			)}
		</div>
	);
}
