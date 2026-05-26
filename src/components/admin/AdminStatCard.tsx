import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Single KPI tile used on the admin dashboard. Optional `href` turns the whole
 * card into a link to a deeper view (e.g. a filtered listings tab).
 */
export function AdminStatCard({
	label,
	value,
	delta,
	icon,
	href,
	tone = "default",
}: {
	label: string;
	value: number | string;
	delta?: string;
	icon?: ReactNode;
	href?: string;
	tone?: "default" | "warning" | "danger";
}) {
	const body = (
		<div
			className={cn(
				"rounded-lg border bg-white p-4 transition-shadow",
				href && "hover:shadow-sm cursor-pointer",
				tone === "default" && "border-black/10",
				tone === "warning" && "border-amber-300 bg-amber-50/40",
				tone === "danger" && "border-red-300 bg-red-50/40"
			)}
		>
			<div className="flex items-center justify-between gap-3">
				<span className="text-xs uppercase tracking-wide text-content-secondary">
					{label}
				</span>
				{icon && <span className="text-content-secondary">{icon}</span>}
			</div>
			<div className="mt-2 text-2xl font-semibold text-content-primary">{value}</div>
			{delta && (
				<div className="mt-1 text-xs text-content-secondary">{delta}</div>
			)}
		</div>
	);
	return href ? <Link href={href}>{body}</Link> : body;
}
