"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepDef } from "./steps";

interface MobileStepBarProps {
	steps: StepDef[];
	currentStepIndex: number;
	completedSteps: number[];
	onStepClick?: (index: number) => void;
}

export function MobileStepBar({
	steps,
	currentStepIndex,
	completedSteps,
	onStepClick,
}: MobileStepBarProps) {
	const [open, setOpen] = useState(false);
	const total = steps.length;
	const progressPct = ((currentStepIndex + 1) / total) * 100;
	const current = steps[currentStepIndex];

	return (
		<div className="md:hidden">
			<div className="h-1 w-full bg-black/10">
				<div
					className="h-full bg-[#af2525] transition-all duration-300"
					style={{ width: `${progressPct}%` }}
				/>
			</div>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="flex w-full items-center justify-between px-4 py-3 text-left"
			>
				<div className="flex flex-col">
					<span className="text-[12px] text-black/60">
						Step {currentStepIndex + 1} of {total}
					</span>
					<span className="text-[15px] font-semibold text-black">
						{current?.label}
					</span>
				</div>
				<ChevronDown
					size={18}
					className={cn("text-black/60 transition-transform", open && "rotate-180")}
				/>
			</button>

			{open ? (
				<>
					<div
						className="fixed inset-0 z-[85] bg-black/30"
						onClick={() => setOpen(false)}
						aria-hidden="true"
					/>
					<div className="absolute left-0 right-0 z-[90] border-y border-black/10 bg-white shadow-lg">
						<ol className="flex flex-col py-2">
							{steps.map((step, idx) => {
								const isActive = idx === currentStepIndex;
								const isComplete = completedSteps.includes(idx) && !isActive;
								const isClickable =
									!!onStepClick && (isComplete || idx < currentStepIndex);
								return (
									<li key={step.key}>
										<button
											type="button"
											disabled={!isClickable}
											onClick={() => {
												if (isClickable) {
													onStepClick?.(idx);
													setOpen(false);
												}
											}}
											className={cn(
												"flex w-full items-center gap-3 px-4 py-3 text-left",
												isClickable ? "cursor-pointer" : "cursor-default"
											)}
										>
											<span
												className={cn(
													"flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
													isComplete && "border-[#1f9d55] bg-[#1f9d55] text-white",
													isActive && "border-[#af2525] bg-[#af2525] text-white",
													!isActive && !isComplete && "border-black/30 bg-white"
												)}
											>
												{isComplete ? <Check size={12} strokeWidth={3} /> : null}
											</span>
											<span
												className={cn(
													"text-[15px]",
													isActive ? "font-semibold text-black" : "text-black/70"
												)}
											>
												{step.label}
											</span>
										</button>
									</li>
								);
							})}
						</ol>
					</div>
				</>
			) : null}
		</div>
	);
}
