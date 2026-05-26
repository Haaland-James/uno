"use client";

import { cn } from "@/lib/utils";

export type AdminTab<T extends string> = {
	key: T;
	label: string;
	count?: number;
};

/**
 * Pill-style tab bar used on admin index pages (listings, users, etc.).
 * Generic over the key type so callers get exhaustive typing on `onChange`.
 */
export function AdminTabs<T extends string>({
	tabs,
	value,
	onChange,
}: {
	tabs: AdminTab<T>[];
	value: T;
	onChange: (next: T) => void;
}) {
	return (
		<div className="mb-6 flex flex-wrap gap-2 border-b border-black/5 pb-2">
			{tabs.map((t) => {
				const active = t.key === value;
				return (
					<button
						key={t.key}
						type="button"
						onClick={() => onChange(t.key)}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
							active
								? "bg-uno-red text-white"
								: "bg-white text-content-secondary hover:bg-black/5"
						)}
					>
						{t.label}
						{typeof t.count === "number" && (
							<span
								className={cn(
									"rounded-full px-1.5 text-[11px] font-semibold",
									active ? "bg-white/20 text-white" : "bg-black/5 text-content-secondary"
								)}
							>
								{t.count}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
