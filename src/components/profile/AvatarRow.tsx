"use client";

import { useEffect, useRef, useState } from "react";
import { CircleUser } from "lucide-react";

interface AvatarRowProps {
	currentPhoto?: string | null;
	initials: string;
	onSave: (photoUrl: string) => void;
}

export function AvatarRow({ currentPhoto, initials, onSave }: AvatarRowProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [pendingUrl, setPendingUrl] = useState<string | null>(null);

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
	};

	const handleSave = () => {
		if (!pendingUrl) return;
		onSave(pendingUrl);
		setPendingUrl(null);
	};

	let subtitle: React.ReactNode;
	if (pendingUrl) {
		subtitle = (
			<span className="text-[13px] text-black/60">
				Profile Uploaded -{" "}
				<button
					type="button"
					onClick={handleSave}
					className="font-semibold text-[#af2525] underline-offset-2 hover:underline"
				>
					SAVE
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
