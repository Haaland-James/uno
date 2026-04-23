"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
	open: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

export function UnfavouriteConfirmDialog({ open, onCancel, onConfirm }: Props) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
		};
		document.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [open, onCancel]);

	if (!open) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="unfav-dialog-title"
			onClick={onCancel}
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="relative w-[min(420px,100%)] rounded-[16px] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
			>
				<button
					type="button"
					onClick={onCancel}
					aria-label="Close"
					className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-[#161515] transition-colors hover:bg-black/5 focus:outline-none"
				>
					<X size={18} />
				</button>

				<p
					id="unfav-dialog-title"
					className="mt-2 text-center text-[16px] leading-snug text-[#161515]"
				>
					Are you sure you want to remove this home from your favorites?
				</p>

				<div className="mt-6 flex gap-3">
					<button
						type="button"
						onClick={onCancel}
						className="flex-1 h-[44px] rounded-full border border-black/15 bg-white text-[15px] font-medium text-[#161515] transition-colors hover:bg-black/[0.04] focus:outline-none"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="flex-1 h-[44px] rounded-full bg-[#af2525] text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus:outline-none"
					>
						Remove
					</button>
				</div>
			</div>
		</div>
	);
}

export default UnfavouriteConfirmDialog;
