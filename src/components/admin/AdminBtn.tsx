"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AdminBtnTone = "green" | "red" | "blue" | "gray" | "brand";

const TONES: Record<AdminBtnTone, string> = {
	green: "bg-green-600 hover:bg-green-700 text-white",
	red: "bg-red-600 hover:bg-red-700 text-white",
	blue: "bg-blue-600 hover:bg-blue-700 text-white",
	gray: "bg-gray-200 hover:bg-gray-300 text-gray-800",
	brand: "bg-uno-red hover:bg-uno-red-hover text-white",
};

/**
 * Small action button used in admin row toolbars and headers. Use `brand` for
 * the primary admin call-to-action; the colour tones are for moderation-style
 * verbs (approve = green, reject = red, etc.).
 */
export function AdminBtn({
	children,
	onClick,
	disabled,
	tone = "gray",
	icon,
	type = "button",
}: {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	tone?: AdminBtnTone;
	icon?: ReactNode;
	type?: "button" | "submit";
}) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
				TONES[tone]
			)}
		>
			{icon}
			{children}
		</button>
	);
}
