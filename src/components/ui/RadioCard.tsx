"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface RadioCardProps {
	selected: boolean;
	onSelect: () => void;
	icon?: React.ReactNode;
	title: string;
	description?: string;
	className?: string;
	/** When true, render as a wide horizontal pill (Role-style). Default false (large card). */
	horizontal?: boolean;
}

export function RadioCard({
	selected,
	onSelect,
	icon,
	title,
	description,
	className,
	horizontal = false,
}: RadioCardProps) {
	if (horizontal) {
		return (
			<button
				type="button"
				onClick={onSelect}
				aria-pressed={selected}
				className={cn(
					"flex w-full items-center gap-3 rounded-[40px] border bg-white px-5 py-3 text-left text-[15px] font-medium text-black transition-colors min-h-[56px]",
					selected
						? "border-[#af2525] ring-1 ring-[#af2525]"
						: "border-[rgba(186,186,186,0.65)] hover:border-black/30",
					className
				)}
			>
				{icon ? (
					<span className="inline-flex h-6 w-6 items-center justify-center text-black/70">
						{icon}
					</span>
				) : null}
				<span>{title}</span>
			</button>
		);
	}

	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={selected}
			className={cn(
				"flex w-full flex-col items-center gap-3 rounded-[18px] border bg-white p-5 text-center transition-colors",
				selected
					? "border-[#af2525] ring-1 ring-[#af2525] shadow-card"
					: "border-black/10 hover:border-black/30 shadow-card",
				className
			)}
		>
			{icon ? (
				<span className="flex h-16 w-16 items-center justify-center text-black/80">
					{icon}
				</span>
			) : null}
			<span className="rounded-[40px] bg-[#af2525] px-5 py-2 text-[14px] font-semibold text-white">
				{title}
			</span>
			{description ? (
				<span className="text-[12px] text-black/60">{description}</span>
			) : null}
		</button>
	);
}
