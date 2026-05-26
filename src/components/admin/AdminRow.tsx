import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Generic row layout for admin list pages. Slots are intentionally untyped
 * beyond ReactNode so callers can compose links, badges, photos, or initials
 * as needed. Keeps every admin list visually identical.
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ [thumb]  title          status   │
 *   │          subtitle                │
 *   │          meta                    │
 *   │          ── alert (optional) ──  │
 *   │          [actions]               │
 *   └─────────────────────────────────────────────────────────┘
 */
export function AdminRow({
	thumbnail,
	title,
	subtitle,
	meta,
	status,
	alert,
	actions,
	className,
}: {
	thumbnail?: ReactNode;
	title: ReactNode;
	subtitle?: ReactNode;
	meta?: ReactNode;
	status?: ReactNode;
	alert?: ReactNode;
	actions?: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex gap-4 rounded-lg border border-black/10 bg-white p-4",
				className
			)}
		>
			{thumbnail && <div className="shrink-0">{thumbnail}</div>}
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<div className="font-medium text-content-primary truncate">{title}</div>
						{subtitle && (
							<div className="text-small text-content-secondary truncate">
								{subtitle}
							</div>
						)}
						{meta && (
							<div className="text-small text-content-secondary mt-1">{meta}</div>
						)}
					</div>
					{status && (
						<div className="flex flex-col items-end gap-1 text-xs shrink-0">
							{status}
						</div>
					)}
				</div>

				{alert && <div className="mt-2">{alert}</div>}

				{actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
			</div>
		</div>
	);
}
