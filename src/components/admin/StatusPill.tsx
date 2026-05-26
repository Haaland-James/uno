import type { ReactNode } from "react";
import type { PropertyStatus, Role } from "@prisma/client";
import { cn } from "@/lib/utils";

export type StatusTone =
	| "success"
	| "warning"
	| "danger"
	| "info"
	| "neutral"
	| "verified"
	| "purple";

const TONES: Record<StatusTone, string> = {
	success: "bg-green-100 text-green-700",
	warning: "bg-amber-100 text-amber-700",
	danger: "bg-red-100 text-red-700",
	info: "bg-blue-100 text-blue-700",
	neutral: "bg-gray-200 text-gray-700",
	verified: "bg-blue-100 text-blue-700",
	purple: "bg-purple-100 text-purple-700",
};

/**
 * Coloured status chip. Single source of truth for the tones used across the
 * admin surface — never hardcode bg-colour text-colour combos inline.
 */
export function StatusPill({
	tone,
	children,
	className,
}: {
	tone: StatusTone;
	children: ReactNode;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"rounded-full px-2 py-0.5 text-xs font-medium",
				TONES[tone],
				className
			)}
		>
			{children}
		</span>
	);
}

export function propertyStatusTone(status: PropertyStatus): StatusTone {
	switch (status) {
		case "ACTIVE":
			return "success";
		case "PENDING":
		case "DRAFT":
			return "warning";
		case "REJECTED":
			return "danger";
		case "PAUSED":
		case "RENTED":
			return "neutral";
		default:
			return "neutral";
	}
}

export function roleTone(role: Role): StatusTone {
	switch (role) {
		case "ADMIN":
			return "danger";
		case "AGENT":
			return "purple";
		case "LANDLORD":
			return "info";
		case "RENTER":
		default:
			return "neutral";
	}
}
