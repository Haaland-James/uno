"use client";

import {
	Children,
	cloneElement,
	isValidElement,
	useEffect,
	useRef,
	useState,
	type ReactElement,
	type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
	trigger: ReactElement;
	align?: "left" | "right";
	menuClassName?: string;
	children: ReactNode;
}

interface DropdownMenuItemProps {
	icon?: ReactNode;
	onClick?: () => void;
	destructive?: boolean;
	children: ReactNode;
	/** Internal — injected by <DropdownMenu> to close the menu after clicking. */
	__close?: () => void;
}

function DropdownMenuItem({
	icon,
	onClick,
	destructive,
	children,
	__close,
}: DropdownMenuItemProps) {
	return (
		<button
			type="button"
			onClick={() => {
				onClick?.();
				__close?.();
			}}
			className={cn(
				"flex w-full items-center gap-3 px-4 py-[10px] text-[14px] font-normal text-left transition-colors hover:bg-[#f5f5f5]",
				destructive ? "text-[#af2525]" : "text-[#0a0a0a]"
			)}
		>
			{icon && (
				<span
					className={cn(
						"shrink-0",
						destructive ? "text-[#af2525]" : "text-black/60"
					)}
				>
					{icon}
				</span>
			)}
			<span>{children}</span>
		</button>
	);
}

// Rough max-height estimate used to decide whether to flip the menu above
// the trigger. Doesn't have to be exact — just needs to be conservative so
// we flip when the natural-down render would be clipped by the viewport.
const ESTIMATED_MENU_HEIGHT = 280;
const ESTIMATED_MENU_WIDTH = 200;

export function DropdownMenu({
	trigger,
	align = "right",
	menuClassName,
	children,
}: DropdownMenuProps) {
	const [open, setOpen] = useState(false);
	const [placement, setPlacement] = useState<{
		vertical: "top" | "bottom";
		horizontal: "left" | "right";
	}>({ vertical: "bottom", horizontal: align });
	const ref = useRef<HTMLDivElement>(null);
	const triggerWrapRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onClickOutside);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onClickOutside);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	// Position-aware: when opening, sample the trigger's location vs the
	// viewport and flip the menu up / sideways if needed.
	function computePlacement() {
		const el = triggerWrapRef.current;
		if (!el) return { vertical: "bottom" as const, horizontal: align };
		const rect = el.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;
		const spaceAbove = rect.top;
		const vertical: "top" | "bottom" =
			spaceBelow < ESTIMATED_MENU_HEIGHT && spaceAbove > spaceBelow ? "top" : "bottom";

		// Horizontal: respect requested align unless it would overflow.
		let horizontal: "left" | "right" = align;
		if (align === "right" && rect.right - ESTIMATED_MENU_WIDTH < 0) horizontal = "left";
		if (align === "left" && rect.left + ESTIMATED_MENU_WIDTH > window.innerWidth)
			horizontal = "right";
		return { vertical, horizontal };
	}

	const close = () => setOpen(false);

	const triggerEl = cloneElement(trigger, {
		onClick: (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			trigger.props.onClick?.(e);
			setOpen((v) => {
				if (!v) setPlacement(computePlacement());
				return !v;
			});
		},
		"aria-expanded": open,
		"aria-haspopup": "menu",
	} as React.HTMLAttributes<HTMLElement>);

	return (
		<div ref={ref} className="relative inline-block">
			<div ref={triggerWrapRef}>{triggerEl}</div>
			{open && (
				<div
					role="menu"
					className={cn(
						"absolute z-50 min-w-[180px] rounded-[12px] border border-black/10 bg-white py-2 shadow-[0px_4px_17px_0px_rgba(0,0,0,0.1)]",
						placement.vertical === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
						placement.horizontal === "right" ? "right-0" : "left-0",
						menuClassName
					)}
				>
					{Children.map(children, (child) =>
						isValidElement(child)
							? cloneElement(child as ReactElement<DropdownMenuItemProps>, {
								__close: close,
							})
							: child
					)}
				</div>
			)}
		</div>
	);
}

DropdownMenu.Item = DropdownMenuItem;
export { DropdownMenuItem };
