"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Building2, Eye, MessageSquare, Heart, TrendingUp, Home as HomeIcon } from "lucide-react";

interface DashboardData {
	activeListings: number;
	totalListings: number;
	totalViews: number;
	totalInquiries: number;
	totalSaves: number;
	recentListings: {
		id: string;
		title: string;
		status: string;
		views: number;
		contactCount: number;
		savedCount: number;
		updatedAt: string;
		photos: { url: string }[];
	}[];
}

function formatCount(n: number) {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
	return String(n);
}

function statusLabel(s: string) {
	switch (s) {
		case "ACTIVE": return "Live";
		case "PAUSED": return "Paused";
		case "RENTED": return "Rented";
		case "PENDING": return "Pending";
		case "REJECTED": return "Rejected";
		default: return s;
	}
}

function statusColor(s: string) {
	switch (s) {
		case "ACTIVE": return "bg-[#22c55e] text-white";
		case "PAUSED": return "bg-[#f5b324] text-white";
		case "RENTED": return "bg-[#6366f1] text-white";
		case "PENDING": return "bg-[#f97316] text-white";
		case "REJECTED": return "bg-[#ef4444] text-white";
		default: return "bg-black/10 text-black/60";
	}
}

function timeAgo(dateStr: string) {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(dateStr).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
	const [data, setData] = useState<DashboardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetch("/api/me/dashboard")
			.then((r) => r.json())
			.then((json) => setData(json.data))
			.catch(() => setData(null))
			.finally(() => setIsLoading(false));
	}, []);

	const stats = data
		? [
				{ label: "Active Listings", value: formatCount(data.activeListings), icon: Building2, sub: `${data.totalListings} total` },
				{ label: "Total Views", value: formatCount(data.totalViews), icon: Eye, sub: "Across all listings" },
				{ label: "Enquiries", value: formatCount(data.totalInquiries), icon: MessageSquare, sub: "Contact requests" },
				{ label: "Saves", value: formatCount(data.totalSaves), icon: Heart, sub: "By renters" },
			]
		: [];

	return (
		<div className="page-container py-4 md:py-6">
			<h1 className="text-[28px] font-bold text-[#161515] md:text-[32px] mb-1">Dashboard</h1>
			<p className="text-[14px] text-black/50 mb-6">
				Overview of your property listings
			</p>

			{/* Stats Grid */}
			<div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
				{isLoading
					? [0, 1, 2, 3].map((i) => (
							<div
								key={i}
								className="h-[120px] animate-pulse rounded-[14px] bg-black/5"
							/>
						))
					: stats.map((stat) => (
							<div
								key={stat.label}
								className="flex flex-col gap-2 rounded-[14px] border border-black/10 bg-white p-4"
							>
								<div className="flex items-center gap-2">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1f1]">
										<stat.icon className="h-4 w-4 text-[#af2525]" />
									</div>
								</div>
								<div className="text-[24px] font-bold text-[#161515] leading-none">
									{stat.value}
								</div>
								<div className="text-[13px] text-black/50">{stat.label}</div>
								<div className="text-[11px] text-[#22c55e] font-medium">
									{stat.sub}
								</div>
							</div>
						))}
			</div>

			{/* Recent Activity */}
			<div className="rounded-[14px] border border-black/10 bg-white">
				<div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
					<h2 className="text-[16px] font-semibold text-[#161515]">
						Recent Activity
					</h2>
					{data && data.totalListings > 0 && (
						<Link
							href="/listing/properties"
							className="text-[13px] font-medium text-[#af2525] hover:underline"
						>
							View all
						</Link>
					)}
				</div>

				{isLoading ? (
					<div className="space-y-0">
						{[0, 1, 2].map((i) => (
							<div
								key={i}
								className="flex items-center gap-3 border-b border-black/5 px-4 py-3 last:border-b-0"
							>
								<div className="h-10 w-10 animate-pulse rounded-lg bg-black/5" />
								<div className="flex-1 space-y-1">
									<div className="h-3 w-3/4 animate-pulse rounded bg-black/5" />
									<div className="h-2.5 w-1/2 animate-pulse rounded bg-black/5" />
								</div>
							</div>
						))}
					</div>
				) : !data || data.recentListings.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f1] mb-3">
							<Building2 className="h-6 w-6 text-[#af2525]" />
						</div>
						<p className="text-[14px] text-black/50 mb-3">No listings yet</p>
						<Link
							href="/listing/properties/new"
							className="inline-flex h-[36px] items-center gap-2 rounded-full bg-[#af2525] px-5 text-[13px] font-semibold text-white hover:opacity-90"
						>
							Add your first property
						</Link>
					</div>
				) : (
					<div>
						{data.recentListings.map((listing) => (
							<Link
								key={listing.id}
								href={
									listing.status === "ACTIVE"
										? `/property/${listing.id}`
										: `/listing/properties/${listing.id}/edit`
								}
								className="flex items-center gap-3 border-b border-black/5 px-4 py-3 last:border-b-0 transition-colors hover:bg-black/[0.02]"
							>
								{/* Thumbnail */}
								<div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-black/5">
									{listing.photos[0]?.url ? (
										<Image
											src={listing.photos[0].url}
											alt={listing.title}
											fill
											className="object-cover"
											sizes="40px"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center">
											<HomeIcon className="h-4 w-4 text-black/20" />
										</div>
									)}
								</div>

								{/* Info */}
								<div className="flex-1 min-w-0">
									<p className="text-[13px] font-medium text-[#161515] truncate">
										{listing.title}
									</p>
									<div className="flex items-center gap-2 mt-0.5">
										<span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusColor(listing.status)}`}>
											{statusLabel(listing.status)}
										</span>
										<span className="text-[11px] text-black/40">
											{timeAgo(listing.updatedAt)}
										</span>
									</div>
								</div>

								{/* Mini stats */}
								<div className="hidden sm:flex items-center gap-3 text-[11px] text-black/40">
									<span className="flex items-center gap-1">
										<Eye size={12} /> {listing.views}
									</span>
									<span className="flex items-center gap-1">
										<MessageSquare size={12} /> {listing.contactCount}
									</span>
									<span className="flex items-center gap-1">
										<Heart size={12} /> {listing.savedCount}
									</span>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
