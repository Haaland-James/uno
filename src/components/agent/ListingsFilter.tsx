"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface Props {
	states: string[];
	statuses: string[];
	months: { label: string; value: string }[]; // "YYYY-MM"
}

const STATUS_LABELS: Record<string, string> = {
	DRAFT: "Draft",
	PENDING: "Pending review",
	ACTIVE: "Active",
	PAUSED: "Off market",
	RENTED: "Rented",
	REJECTED: "Rejected",
};

export function ListingsFilter({ states, statuses, months }: Props) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const state = searchParams.get("state") ?? "";
	const status = searchParams.get("status") ?? "";
	const month = searchParams.get("month") ?? "";

	const update = useCallback(
		(key: string, value: string) => {
			const params = new URLSearchParams(searchParams.toString());
			if (value) params.set(key, value);
			else params.delete(key);
			router.replace(`${pathname}?${params.toString()}`);
		},
		[router, pathname, searchParams]
	);

	const hasFilters = state || status || month;

	return (
		<div className="mb-4 flex flex-wrap items-center gap-2">
			<select
				value={state}
				onChange={(e) => update("state", e.target.value)}
				className="h-9 rounded-md border border-black/10 bg-white px-3 text-sm text-content-primary focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red"
			>
				<option value="">All states</option>
				{states.map((s) => (
					<option key={s} value={s}>{s}</option>
				))}
			</select>

			<select
				value={status}
				onChange={(e) => update("status", e.target.value)}
				className="h-9 rounded-md border border-black/10 bg-white px-3 text-sm text-content-primary focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red"
			>
				<option value="">All statuses</option>
				{statuses.map((s) => (
					<option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
				))}
			</select>

			<select
				value={month}
				onChange={(e) => update("month", e.target.value)}
				className="h-9 rounded-md border border-black/10 bg-white px-3 text-sm text-content-primary focus:border-uno-red focus:outline-none focus:ring-1 focus:ring-uno-red"
			>
				<option value="">All dates</option>
				{months.map((m) => (
					<option key={m.value} value={m.value}>{m.label}</option>
				))}
			</select>

			{hasFilters && (
				<button
					onClick={() => router.replace(pathname)}
					className="h-9 rounded-md border border-black/10 bg-white px-3 text-sm text-content-secondary hover:bg-black/5"
				>
					Clear filters
				</button>
			)}
		</div>
	);
}
