"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface NumberInputProps {
	id?: string;
	value: number | null;
	onChange: (value: number | null) => void;
	min?: number;
	max?: number;
	step?: number;
	placeholder?: string;
	suffix?: string;
	className?: string;
	"aria-label"?: string;
}

/**
 * Plain integer input styled to match the rest of the form. Shows a
 * non-interactive suffix (e.g. "sqm") on the right when provided.
 * Stores the raw integer; empty input clears to null.
 */
export function NumberInput({
	id,
	value,
	onChange,
	min,
	max,
	step,
	placeholder,
	suffix,
	className,
	"aria-label": ariaLabel,
}: NumberInputProps) {
	const [focused, setFocused] = useState(false);

	return (
		<div
			className={cn(
				"flex h-12 w-full items-center rounded-[40px] border bg-white pl-5 pr-5 transition-colors",
				focused
					? "border-[#af2525]"
					: "border-[rgba(186,186,186,0.65)]",
				className
			)}
		>
			<input
				id={id}
				type="number"
				inputMode="numeric"
				autoComplete="off"
				aria-label={ariaLabel}
				min={min}
				max={max}
				step={step}
				value={value ?? ""}
				placeholder={placeholder}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				onChange={(e) => {
					const v = e.target.value;
					if (v === "") return onChange(null);
					const n = Number(v);
					onChange(Number.isFinite(n) ? n : null);
				}}
				className="h-full w-full bg-transparent text-[15px] font-normal text-black outline-none placeholder:text-[rgba(10,10,10,0.4)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			/>
			{suffix ? (
				<span className="ml-2 select-none text-[14px] font-medium text-black/55">
					{suffix}
				</span>
			) : null}
		</div>
	);
}
