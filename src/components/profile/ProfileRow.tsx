"use client";

import React from "react";
import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileRowProps {
	icon: React.ReactNode;
	label: string;
	value?: string | null;
	emptyText?: string;
	isOpen: boolean;
	onToggle: () => void;
	rightAddon?: React.ReactNode;
	actionMode?: "edit" | "add";
	hideAction?: boolean;
	children?: React.ReactNode;
}

export function ProfileRow({
	icon,
	label,
	value,
	emptyText = "Not provided",
	isOpen,
	onToggle,
	rightAddon,
	actionMode,
	hideAction = false,
	children,
}: ProfileRowProps) {
	const mode: "edit" | "add" = actionMode ?? (value ? "edit" : "add");
	const ActionIcon = mode === "edit" ? Pencil : Plus;
	const actionLabel = mode === "edit" ? "Edit" : "Add";

	return (
		<div className="bg-[#f5f5f5] border-b border-white/80 last:border-b-0">
			<div className="flex items-center gap-4 px-5 py-4">
				<div className="flex h-6 w-6 shrink-0 items-center justify-center text-black/70">
					{icon}
				</div>
				<div className="flex min-w-0 flex-1 flex-col">
					<span className="text-[15px] font-medium text-black">{label}</span>
					{value ? (
						<span className="truncate text-[13px] text-black/60">{value}</span>
					) : (
						<span className="text-[13px] text-black/40">{emptyText}</span>
					)}
				</div>
				{rightAddon}
				{!hideAction &&
					(isOpen ? (
						<button
							type="button"
							onClick={onToggle}
							className="text-[14px] font-medium text-black/60 transition-colors hover:text-black"
						>
							Cancel
						</button>
					) : (
						<button
							type="button"
							onClick={onToggle}
							className="inline-flex items-center gap-1 text-[14px] font-medium text-black transition-colors hover:text-[#af2525]"
						>
							<ActionIcon size={14} strokeWidth={2} />
							{actionLabel}
						</button>
					))}
			</div>

			<div
				className={cn(
					"grid transition-[grid-template-rows] duration-300 ease-out",
					isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
				)}
			>
				<div className="overflow-hidden">
					<div className="px-5 pb-5">{children}</div>
				</div>
			</div>
		</div>
	);
}
