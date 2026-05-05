"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AreaComboboxProps {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	suggestions: ReadonlyArray<string>;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	"aria-label"?: string;
}

/**
 * Combobox for picking a known area or adding a new one inline.
 * - Typeahead filters `suggestions` by substring (case-insensitive).
 * - "Add new" option appears when the typed value doesn't match any suggestion.
 * - Closes on outside click or Escape.
 */
export function AreaCombobox({
	id,
	value,
	onChange,
	suggestions,
	placeholder = "Type or pick an area",
	disabled,
	className,
	"aria-label": ariaLabel,
}: AreaComboboxProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState(value);
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const listboxId = useId();

	useEffect(() => {
		setQuery(value);
	}, [value]);

	useEffect(() => {
		if (!open) return;
		const onClickAway = (e: MouseEvent) => {
			if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
		};
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", onClickAway);
		document.addEventListener("keydown", onEsc);
		return () => {
			document.removeEventListener("mousedown", onClickAway);
			document.removeEventListener("keydown", onEsc);
		};
	}, [open]);

	const trimmed = query.trim();
	const filtered = useMemo(() => {
		if (!suggestions.length) return [];
		if (!trimmed) return suggestions.slice(0, 12);
		const q = trimmed.toLowerCase();
		return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 12);
	}, [suggestions, trimmed]);

	const exactMatch = suggestions.some(
		(s) => s.toLowerCase() === trimmed.toLowerCase()
	);
	const showAddNew = trimmed.length > 1 && !exactMatch;

	const commit = (v: string) => {
		onChange(v);
		setQuery(v);
		setOpen(false);
	};

	return (
		<div ref={wrapperRef} className={cn("relative w-full", className)}>
			<input
				id={id}
				type="text"
				role="combobox"
				aria-expanded={open}
				aria-controls={listboxId}
				aria-autocomplete="list"
				aria-label={ariaLabel}
				autoComplete="off"
				value={query}
				placeholder={placeholder}
				disabled={disabled}
				onFocus={() => setOpen(true)}
				onChange={(e) => {
					setQuery(e.target.value);
					setOpen(true);
					// Live-update so the parent always has the freshest text. It's still
					// an "in progress" value until they pick a suggestion or commit.
					onChange(e.target.value);
				}}
				className="h-12 w-full rounded-[40px] border border-[rgba(186,186,186,0.65)] bg-white px-5 text-[15px] font-normal text-black outline-none transition-colors placeholder:text-[rgba(10,10,10,0.4)] focus:border-[#af2525] disabled:cursor-not-allowed disabled:opacity-50"
			/>

			{open && (filtered.length > 0 || showAddNew) ? (
				<div
					id={listboxId}
					role="listbox"
					className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[260px] overflow-y-auto rounded-[16px] border border-black/10 bg-white py-1 shadow-card"
				>
					{filtered.map((s) => (
						<button
							key={s}
							type="button"
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => commit(s)}
							className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px] text-black hover:bg-black/5"
						>
							<span>{s}</span>
							{value === s ? <Check size={14} className="text-[#af2525]" /> : null}
						</button>
					))}
					{showAddNew ? (
						<button
							type="button"
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => commit(trimmed)}
							className="flex w-full items-center gap-2 border-t border-black/5 px-4 py-2.5 text-left text-[14px] text-[#af2525] hover:bg-[#af2525]/5"
						>
							<Plus size={14} />
							<span>
								Add &ldquo;<span className="font-medium">{trimmed}</span>&rdquo;
							</span>
						</button>
					) : null}
				</div>
			) : null}
		</div>
	);
}
