"use client";

import { cn } from "@/lib/utils";

interface WizardFooterProps {
	onBack?: () => void;
	onNext?: () => void;
	canBack?: boolean;
	canNext?: boolean;
	nextLabel?: string;
	hideBack?: boolean;
}

export function WizardFooter({
	onBack,
	onNext,
	canBack = true,
	canNext = true,
	nextLabel = "Next",
	hideBack = false,
}: WizardFooterProps) {
	return (
		<div className="sticky bottom-0 z-10 border-t border-black/10 bg-white">
			<div className="mx-auto flex max-w-[960px] items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
				<button
					type="button"
					onClick={onBack}
					disabled={!canBack || hideBack}
					className={cn(
						"inline-flex h-[41px] min-w-[120px] items-center justify-center rounded-[50px] border border-black/15 bg-white px-6 text-[15px] font-semibold text-black transition-colors hover:bg-black/5 disabled:opacity-40",
						hideBack && "invisible"
					)}
				>
					Back
				</button>
				<button
					type="button"
					onClick={onNext}
					disabled={!canNext}
					className={cn(
						"inline-flex h-[41px] min-w-[120px] items-center justify-center rounded-[50px] bg-[#af2525] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#93191d] disabled:bg-[rgba(175,37,37,0.5)]"
					)}
				>
					{nextLabel}
				</button>
			</div>
		</div>
	);
}
