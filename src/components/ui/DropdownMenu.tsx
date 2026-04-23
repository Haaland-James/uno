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

export function DropdownMenu({
	trigger,
	align = "right",
	menuClassName,
	children,
}: DropdownMenuProps) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

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

	const close = () => setOpen(false);

	const triggerEl = cloneElement(trigger, {
		onClick: (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			trigger.props.onClick?.(e);
			setOpen((v) => !v);
		},
		"aria-expanded": open,
		"aria-haspopup": "menu",
	} as React.HTMLAttributes<HTMLElement>);

	return (
		<div ref={ref} className="relative inline-block">
			{triggerEl}
			{open && (
				<div
					role="menu"
					className={cn(
						"absolute z-50 mt-2 min-w-[180px] rounded-[12px] border border-black/10 bg-white py-2 shadow-[0px_4px_17px_0px_rgba(0,0,0,0.1)]",
						align === "right" ? "right-0" : "left-0",
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
