"use client";

import { useEffect, useState } from "react";
import { BarChart3, Building2, Eye, Phone, TrendingUp } from "lucide-react";
import { analyticsClient, type AnalyticsResult } from "@/lib/clients/analytics";
import { statusLabel, statusColor } from "@/lib/property-status";
import { toast } from "@/stores/toastStore";
import { formatCount, cn } from "@/lib/utils";

function formatMonth(key: string) {
	const [year, month] = key.split("-");
	return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-NG", {
		month: "short",
		year: "numeric",
	});
}

/**
 * A single 6-month bar chart. Bars are plain divs rather than a charting
 * library — six values don't justify the bundle cost.
 */
function MonthlyBars({
	title,
	months,
	values,
	barClass,
}: {
	title: string;
	months: string[];
	values: Record<string, number>;
	barClass: string;
}) {
	// Scale against the tallest month, never against 0.
	const max = Math.max(...months.map((m) => values[m] ?? 0), 1);

	return (
		<div className="rounded-[14px] border border-black/10 bg-white p-4">
			<h2 className="mb-4 text-[16px] font-semibold text-[#161515]">{title}</h2>
			<div className="flex gap-2">
				{months.map((key) => {
					const val = values[key] ?? 0;
					const pct = Math.round((val / max) * 100);
					return (
						<div key={key} className="flex flex-1 flex-col items-center gap-1">
							<span className="text-[10px] text-black/50">{val}</span>
							{/*
							 * The track must carry a DEFINITE height (h-32), because the bar
							 * below sizes itself as a percentage. A percentage height only
							 * resolves against a definite parent — against an auto-height
							 * parent it collapses to 0 and the chart renders blank.
							 */}
							<div className="flex h-32 w-full items-end">
								{/* Floor the height so a non-zero month is never a hairline. */}
								<div
									className={cn("w-full rounded-t", barClass)}
									style={{ height: `${Math.max(pct, val > 0 ? 4 : 1)}%` }}
								/>
							</div>
							<span className="text-center text-[9px] leading-tight text-black/50">
								{formatMonth(key)}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default function AnalyticsPage() {
	const [data, setData] = useState<AnalyticsResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		analyticsClient
			.get()
			.then((res) => {
				if (!cancelled) setData(res);
			})
			.catch((e) => {
				if (!cancelled) {
					toast.error(e instanceof Error ? e.message : "Could not load analytics");
				}
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const stats = data
		? [
				{ label: "Total views", value: data.totalViews, icon: Eye },
				{ label: "Total contacts", value: data.totalContacts, icon: Phone },
				{ label: "Contacts (30d)", value: data.contacts30d, icon: TrendingUp },
				{ label: "Published listings", value: data.publishedListings, icon: Building2 },
			]
		: [];

	return (
		<div className="page-container py-4 md:py-6">
			<h1 className="text-[28px] font-bold text-[#161515] md:text-[32px] mb-1">Analytics</h1>
			<p className="text-[14px] text-black/50 mb-6">
				Track the performance of your property listings
			</p>

			{isLoading ? (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="h-[120px] animate-pulse rounded-[14px] bg-black/5" />
					))}
				</div>
			) : !data || data.totalListings === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f1]">
						<BarChart3 className="h-8 w-8 text-[#af2525]" />
					</div>
					<h3 className="mb-2 text-[18px] font-semibold text-[#161515]">No data yet</h3>
					<p className="max-w-sm text-[14px] text-black/50">
						Once you list properties, you&apos;ll see detailed analytics about views,
						enquiries, and performance here.
					</p>
				</div>
			) : (
				<div className="space-y-6">
					{/* Summary stats */}
					<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
						{stats.map((stat) => (
							<div
								key={stat.label}
								className="flex flex-col gap-2 rounded-[14px] border border-black/10 bg-white p-4"
							>
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1f1]">
									<stat.icon className="h-4 w-4 text-[#af2525]" />
								</div>
								<div className="text-[24px] font-bold leading-none text-[#161515]">
									{formatCount(stat.value)}
								</div>
								<div className="text-[13px] text-black/50">{stat.label}</div>
							</div>
						))}
					</div>

					{/* Monthly charts */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<MonthlyBars
							title="New listings — last 6 months"
							months={data.months}
							values={data.listingsByMonth}
							barClass="bg-[#af2525]/70"
						/>
						<MonthlyBars
							title="Renter contacts — last 6 months"
							months={data.months}
							values={data.contactsByMonth}
							barClass="bg-[#22c55e]/70"
						/>
					</div>

					{/* Top listings by views */}
					<div className="overflow-hidden rounded-[14px] border border-black/10 bg-white">
						<div className="border-b border-black/5 px-4 py-3">
							<h2 className="text-[16px] font-semibold text-[#161515]">
								Top listings by views
							</h2>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-black/50">
									<tr>
										<th className="px-4 py-2 font-medium">Property</th>
										<th className="px-4 py-2 font-medium">Status</th>
										<th className="px-4 py-2 text-right font-medium">Views</th>
										<th className="px-4 py-2 text-right font-medium">Contacts</th>
										<th className="px-4 py-2 text-right font-medium">Conv %</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-black/5">
									{data.topListings.map((p) => {
										// Guard against 0 views — a listing nobody has seen has no
										// meaningful conversion rate, so show a dash, not "0%".
										const conv =
											p.views > 0 ? `${((p.contactCount / p.views) * 100).toFixed(1)}%` : "—";
										return (
											<tr key={p.id} className="hover:bg-black/[0.02]">
												<td className="px-4 py-2">
													<a
														href={`/property/${p.id}`}
														target="_blank"
														rel="noopener noreferrer"
														className="font-medium text-[#161515] hover:underline"
													>
														{p.title}
													</a>
													<div className="text-xs text-black/50">{p.area || p.city}</div>
												</td>
												<td className="px-4 py-2">
													<span
														className={cn(
															"inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
															statusColor(p.status)
														)}
													>
														{statusLabel(p.status)}
													</span>
												</td>
												<td className="px-4 py-2 text-right text-black/50">{p.views}</td>
												<td className="px-4 py-2 text-right text-black/50">
													{p.contactCount}
												</td>
												<td className="px-4 py-2 text-right text-black/50">{conv}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
