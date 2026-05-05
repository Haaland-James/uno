"use client";

import React, { useMemo, useState } from "react";
import { cn, formatNaira } from "@/lib/utils";

export type FeeMode = "FIXED" | "PERCENT";

export interface FeeValue {
	mode: FeeMode;
	value: number | null;
}

interface FeeInputProps {
	id?: string;
	value: FeeValue;
	onChange: (next: FeeValue) => void;
	/** When mode is PERCENT, used to render a live ₦ preview. */
	baseAmount?: number | null;
	placeholder?: string;
	className?: string;
	"aria-label"?: string;
}

const formatter = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

function format(value: number | null): string {
	if (value === null || Number.isNaN(value)) return "";
	return formatter.format(value);
}

function parseDigits(raw: string): number | null {
	const digits = raw.replace(/[^\d]/g, "");
	if (!digits) return null;
	return Number(digits);
}

/**
 * Fee input with a Fixed (₦) / Percent (%) toggle. Stores `{ mode, value }`.
 * When `mode === "PERCENT"`, shows a live ₦ preview against `baseAmount`.
 */
export function FeeInput({
	id,
	value,
	onChange,
	baseAmount,
	placeholder = "0",
	className,
	"aria-label": ariaLabel,
}: FeeInputProps) {
	const [focused, setFocused] = useState(false);
	const isPercent = value.mode === "PERCENT";

	const displayed = useMemo(() => format(value.value), [value.value]);

	const preview = useMemo(() => {
		if (!isPercent) return null;
		if (value.value === null || !baseAmount) return null;
		const computed = Math.round((baseAmount * value.value) / 100);
		return formatNaira(computed);
	}, [isPercent, value.value, baseAmount]);

	const setMode = (mode: FeeMode) => {
		if (mode === value.mode) return;
		onChange({ mode, value: value.value });
	};

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<div
				className={cn(
					"flex h-12 w-full items-center rounded-[40px] border bg-white pl-1.5 pr-5 transition-colors",
					focused
						? "border-[#af2525]"
						: "border-[rgba(186,186,186,0.65)]"
				)}
			>
				<div className="mr-3 flex h-9 items-center gap-0.5 rounded-full bg-black/5 p-0.5">
					<button
						type="button"
						onClick={() => setMode("FIXED")}
						className={cn(
							"h-8 rounded-full px-3 text-[12px] font-medium transition-colors",
							!isPercent
								? "bg-white text-black shadow-sm"
								: "text-black/55 hover:text-black"
						)}
					>
						₦
					</button>
					<button
						type="button"
						onClick={() => setMode("PERCENT")}
						className={cn(
							"h-8 rounded-full px-3 text-[12px] font-medium transition-colors",
							isPercent
								? "bg-white text-black shadow-sm"
								: "text-black/55 hover:text-black"
						)}
					>
						%
					</button>
				</div>
				<input
					id={id}
					inputMode="numeric"
					autoComplete="off"
					aria-label={ariaLabel}
					value={displayed}
					placeholder={placeholder}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					onChange={(e) => onChange({ ...value, value: parseDigits(e.target.value) })}
					className="h-full w-full bg-transparent text-[15px] font-normal text-black outline-none placeholder:text-[rgba(10,10,10,0.4)]"
				/>
				{isPercent ? (
					<span className="ml-2 select-none text-[14px] font-medium text-black/60">
						%
					</span>
				) : null}
			</div>
			{preview ? (
				<p className="pl-4 text-[12px] text-black/55">≈ {preview}</p>
			) : null}
		</div>
	);
}
