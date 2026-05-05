"use client";

import { Modal } from "@/components/ui/Modal";

interface DraftWarningModalProps {
	open: boolean;
	onClose: () => void;
	onSaveDraft: () => void;
	onDiscard: () => void;
	/** True when the wizard was loaded from an existing server draft. Tweaks copy so
	 *  the user knows discarding only drops in-session changes, not the saved draft. */
	editingExistingDraft?: boolean;
}

export function DraftWarningModal({
	open,
	onClose,
	onSaveDraft,
	onDiscard,
	editingExistingDraft = false,
}: DraftWarningModalProps) {
	const title = editingExistingDraft ? "Close listing wizard?" : "Finish Listing";
	const body = editingExistingDraft
		? "Save your changes to this draft, or discard them and keep the saved version."
		: "You've started adding a property. What would you like to do?";
	const saveLabel = editingExistingDraft ? "Save changes" : "Save as Draft";
	const discardLabel = editingExistingDraft ? "Discard changes" : "Discard";

	return (
		<Modal open={open} onClose={onClose} className="max-w-[380px]" ariaLabel={title}>
			<div className="flex flex-col items-start gap-3 p-6">
				<h2 className="text-[18px] font-semibold text-black">{title}</h2>
				<p className="text-[14px] text-black/70">{body}</p>
				<div className="mt-3 flex w-full items-center gap-3">
					<button
						type="button"
						onClick={onSaveDraft}
						className="inline-flex h-[40px] flex-1 items-center justify-center rounded-[50px] bg-[#af2525] px-4 text-[14px] font-semibold text-white hover:bg-[#93191d]"
					>
						{saveLabel}
					</button>
					<button
						type="button"
						onClick={onDiscard}
						className="inline-flex h-[40px] flex-1 items-center justify-center rounded-[50px] border border-black/15 bg-white px-4 text-[14px] font-semibold text-black hover:bg-black/5"
					>
						{discardLabel}
					</button>
				</div>
			</div>
		</Modal>
	);
}
