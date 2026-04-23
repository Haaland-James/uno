"use client";

import { Modal } from "@/components/ui/Modal";

interface DraftWarningModalProps {
	open: boolean;
	onClose: () => void;
	onSaveDraft: () => void;
	onDiscard: () => void;
}

export function DraftWarningModal({
	open,
	onClose,
	onSaveDraft,
	onDiscard,
}: DraftWarningModalProps) {
	return (
		<Modal open={open} onClose={onClose} className="max-w-[380px]" ariaLabel="Finish listing">
			<div className="flex flex-col items-start gap-3 p-6">
				<h2 className="text-[18px] font-semibold text-black">Finish Listing</h2>
				<p className="text-[14px] text-black/70">
					You&apos;ve started adding a property. What would you like to do?
				</p>
				<div className="mt-3 flex w-full items-center gap-3">
					<button
						type="button"
						onClick={onSaveDraft}
						className="inline-flex h-[40px] flex-1 items-center justify-center rounded-[50px] bg-[#af2525] px-4 text-[14px] font-semibold text-white hover:bg-[#93191d]"
					>
						Save as Draft
					</button>
					<button
						type="button"
						onClick={onDiscard}
						className="inline-flex h-[40px] flex-1 items-center justify-center rounded-[50px] border border-black/15 bg-white px-4 text-[14px] font-semibold text-black hover:bg-black/5"
					>
						Discard
					</button>
				</div>
			</div>
		</Modal>
	);
}
