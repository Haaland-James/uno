"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepDef } from "./steps";

interface StepIndicatorProps {
	steps: StepDef[];
	currentStepIndex: number;
	completedSteps: number[];
	onStepClick?: (index: number) => void;
}

export function StepIndicator({
	steps,
	currentStepIndex,
	completedSteps,
	onStepClick,
}: StepIndicatorProps) {
	return (
		<nav aria-label="List property steps" className="w-full">
			<h2 className="mb-6 text-[18px] font-semibold text-black">List Property</h2>
			<ol className="flex flex-col gap-5">
				{steps.map((step, idx) => {
					const isActive = idx === currentStepIndex;
					const isComplete = completedSteps.includes(idx) && !isActive;
					const isClickable = !!onStepClick && (isComplete || idx < currentStepIndex);

					return (
						<li key={step.key}>
							<button
								type="button"
								disabled={!isClickable}
								onClick={isClickable ? () => onStepClick?.(idx) : undefined}
								className={cn(
									"flex items-center gap-3 text-left",
									isClickable ? "cursor-pointer" : "cursor-default"
								)}
							>
								<span
									className={cn(
										"flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
										isComplete && "border-[#1f9d55] bg-[#1f9d55] text-white",
										isActive && "border-[#af2525] bg-[#af2525] text-white",
										!isActive && !isComplete && "border-black/30 bg-white text-black/40"
									)}
								>
									{isComplete ? <Check size={12} strokeWidth={3} /> : null}
								</span>
								<span
									className={cn(
										"text-[14px]",
										isActive
											? "font-semibold text-black"
											: isComplete
												? "text-black/70"
												: "text-black/50"
									)}
								>
									{step.label}
								</span>
							</button>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
