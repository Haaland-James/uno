"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
	id?: string;
	value: number | null;
	onChange: (value: number | null) => void;
	currency?: "NGN";
	placeholder?: string;
	className?: string;
	"aria-label"?: string;
}

const CURRENCY_SYMBOLS = { NGN: "₦" } as const;

const formatter = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

function formatDisplay(value: number | null): string {
	if (value === null || Number.isNaN(value)) return "";
	return formatter.format(value);
}

function parseInput(raw: string): number | null {
	const digits = raw.replace(/[^\d]/g, "");
	if (!digits) return null;
	return Number(digits);
}

/**
 * Naira-formatted money input. Stores raw integer naira; displays with
 * thousands separators and a ₦ prefix inside the input.
 */
export function MoneyInput({
	id,
	value,
	onChange,
	currency = "NGN",
	placeholder = "0",
	className,
	"aria-label": ariaLabel,
}: MoneyInputProps) {
	const [focused, setFocused] = useState(false);
	const symbol = CURRENCY_SYMBOLS[currency];

	const displayed = useMemo(() => formatDisplay(value), [value]);

	return (
		<div
			className={cn(
				"flex h-12 w-full items-center rounded-[40px] border bg-white pl-4 pr-5 transition-colors",
				focused
					? "border-[#af2525]"
					: "border-[rgba(186,186,186,0.65)]",
				className
			)}
		>
			<span className="mr-2 select-none text-[15px] font-medium text-black/70">
				{symbol}
			</span>
			<input
				id={id}
				inputMode="numeric"
				autoComplete="off"
				aria-label={ariaLabel}
				value={displayed}
				placeholder={placeholder}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				onChange={(e) => onChange(parseInput(e.target.value))}
				className="h-full w-full bg-transparent text-[15px] font-normal text-black outline-none placeholder:text-[rgba(10,10,10,0.4)]"
			/>
		</div>
	);
}
