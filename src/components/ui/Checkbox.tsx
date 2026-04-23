"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
	disabled?: boolean;
	className?: string;
	id?: string;
}

export function Checkbox({
	checked,
	onChange,
	label,
	disabled,
	className,
	id,
}: CheckboxProps) {
	return (
		<label
			htmlFor={id}
			className={cn(
				"inline-flex cursor-pointer items-center gap-2 select-none",
				disabled && "cursor-not-allowed opacity-60",
				className
			)}
		>
			<span
				className={cn(
					"flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
					checked
						? "border-[#af2525] bg-[#af2525] text-white"
						: "border-black/30 bg-white"
				)}
			>
				{checked ? <Check size={14} strokeWidth={3} /> : null}
			</span>
			<input
				id={id}
				type="checkbox"
				className="sr-only"
				checked={checked}
				disabled={disabled}
				onChange={(e) => onChange(e.target.checked)}
			/>
			<span className="text-[14px] text-black">{label}</span>
		</label>
	);
}
