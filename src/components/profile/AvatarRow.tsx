"use client";

import { useEffect, useRef, useState } from "react";
import { CircleUser, Loader2 } from "lucide-react";
import { toast } from "@/stores/toastStore";

interface AvatarRowProps {
	currentPhoto?: string | null;
	initials: string;
	onSave: (photoUrl: string) => void;
}

async function uploadToCloudinary(file: File): Promise<string> {
	if (!file.type.startsWith("image/")) {
		throw new Error("Please choose an image file");
	}
	if (file.size > 5 * 1024 * 1024) {
		throw new Error("Photo must be under 5 MB");
	}
	const res = await fetch("/api/uploads/sign", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type: "avatar" }),
	});
	if (!res.ok) throw new Error("Failed to get upload signature");
	const { data } = await res.json();

	const form = new FormData();
	form.append("file", file);
	form.append("api_key", data.apiKey);
	form.append("timestamp", String(data.timestamp));
	form.append("signature", data.signature);
	form.append("folder", data.folder);
	// Signed param — must match the signature or Cloudinary rejects the upload
	form.append("allowed_formats", data.allowedFormats);

	const upload = await fetch(
		`https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
		{ method: "POST", body: form }
	);
	if (!upload.ok) throw new Error("Upload failed");
	const result = await upload.json();
	return result.secure_url;
}

export function AvatarRow({ currentPhoto, initials, onSave }: AvatarRowProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [pendingUrl, setPendingUrl] = useState<string | null>(null);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		return () => {
			if (pendingUrl) URL.revokeObjectURL(pendingUrl);
		};
	}, [pendingUrl]);

	const displayedPhoto = pendingUrl ?? currentPhoto ?? null;

	const handlePick = () => fileInputRef.current?.click();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (pendingUrl) URL.revokeObjectURL(pendingUrl);
		setPendingUrl(URL.createObjectURL(file));
		setPendingFile(file);
	};

	const handleSave = async () => {
		if (!pendingFile) return;
		setUploading(true);
		try {
			const cloudinaryUrl = await uploadToCloudinary(pendingFile);
			onSave(cloudinaryUrl);
			setPendingUrl(null);
			setPendingFile(null);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setUploading(false);
		}
	};

	let subtitle: React.ReactNode;
	if (pendingUrl) {
		subtitle = (
			<span className="text-[13px] text-black/60">
				Profile Uploaded -{" "}
				<button
					type="button"
					onClick={handleSave}
					disabled={uploading}
					className="font-semibold text-[#af2525] underline-offset-2 hover:underline disabled:opacity-50"
				>
					{uploading ? (
						<span className="inline-flex items-center gap-1">
							<Loader2 className="h-3 w-3 animate-spin" />
							Saving…
						</span>
					) : (
						"SAVE"
					)}
				</button>
			</span>
		);
	} else if (currentPhoto) {
		subtitle = (
			<button
				type="button"
				onClick={handlePick}
				className="text-left text-[13px] font-medium text-[#af2525] hover:underline"
			>
				Change
			</button>
		);
	} else {
		subtitle = (
			<button
				type="button"
				onClick={handlePick}
				className="text-left text-[13px] text-black/60 hover:text-black"
			>
				Upload
			</button>
		);
	}

	return (
		<div className="flex items-center gap-4 border-b border-white/80 bg-[#f5f5f5] px-5 py-4">
			<div className="flex h-6 w-6 shrink-0 items-center justify-center text-black/70">
				<CircleUser size={20} strokeWidth={1.75} />
			</div>
			<div className="flex min-w-0 flex-1 flex-col">
				<span className="text-[15px] font-medium text-black">Profile Avatar</span>
				{subtitle}
			</div>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFileChange}
			/>
			<button
				type="button"
				onClick={handlePick}
				aria-label="Change avatar"
				className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#af2525] transition-transform hover:scale-105"
			>
				{displayedPhoto ? (
					/* eslint-disable-next-line @next/next/no-img-element */
					<img
						src={displayedPhoto}
						alt="Profile avatar"
						className="absolute inset-0 h-full w-full object-cover"
					/>
				) : (
					<span className="text-[14px] font-normal tracking-[-0.3px] text-white">
						{initials}
					</span>
				)}
			</button>
		</div>
	);
}
