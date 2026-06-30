"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, CheckCircle2 } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";
import { useFavourites } from "@/hooks/useFavourites";
import { useHeaderStore } from "@/stores/headerStore";
import { propertiesClient } from "@/lib/clients/properties";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";
import { nodeToSearchUrl, resolveTextToUrl } from "@/lib/search-url";
import type { PropertyCardData } from "@/types/property";
import { cn } from "@/lib/utils";

type Category = "all" | "rent" | "sale" | "lease";
type TogglePill = "latest" | "virgin" | "price-drops" | "favs";

const CATEGORY_LABELS: Record<Category, string> = {
	all: "All",
	rent: "Rent",
	sale: "Sale",
	lease: "Lease",
};

const TOGGLE_LABELS: Record<TogglePill, string> = {
	latest: "Latest Additions",
	virgin: "Virgin",
	"price-drops": "Price Drops",
	favs: "Favs",
};

export default function FeedPage() {
	const router = useRouter();
	const { isFavourited, toggleFavourite } = useFavourites();
	const setShowSearch = useHeaderStore((s) => s.setShowSearch);

	const [category, setCategory] = useState<Category>("all");
	const [activeToggles, setActiveToggles] = useState<Set<TogglePill>>(new Set());
	const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

	const sentinelRef = useRef<HTMLDivElement>(null);
	const categoryDropdownRef = useRef<HTMLDivElement>(null);

	// Hide the header's search while this page's own search is visible;
	// show it once the user scrolls past it.
	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		setShowSearch(false);

		const observer = new IntersectionObserver(
			([entry]) => {
				setShowSearch(!entry.isIntersecting);
			},
			{ rootMargin: "-64px 0px 0px 0px", threshold: 0 }
		);
		observer.observe(sentinel);

		return () => {
			observer.disconnect();
			setShowSearch(true);
		};
	}, [setShowSearch]);

	// Close the All ▾ dropdown on outside click
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				categoryDropdownRef.current &&
				!categoryDropdownRef.current.contains(e.target as Node)
			) {
				setCategoryDropdownOpen(false);
			}
		}
		if (categoryDropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [categoryDropdownOpen]);

	function togglePill(pill: TogglePill) {
		setActiveToggles((prev) => {
			const next = new Set(prev);
			if (next.has(pill)) {
				next.delete(pill);
			} else {
				next.add(pill);
			}
			return next;
		});
	}

	function clearFilters() {
		setCategory("all");
		setActiveToggles(new Set());
	}

	const hasActiveFilters =
		category !== "all" || activeToggles.size > 0;

	// Build a human-readable label of active filters for the end-of-list block
	function activeFilterLabel(): string {
		const parts: string[] = [];
		if (category !== "all") parts.push(`For ${CATEGORY_LABELS[category]}`);
		activeToggles.forEach((t) => parts.push(TOGGLE_LABELS[t]));
		return parts.join(", ");
	}

	// All ACTIVE listings, newest first.
	// Server-side filters: category tab → listingType, "virgin" → verifiedOnly.
	const listingTypeFilter: ("RENT" | "LEASE" | "SALE")[] | undefined =
		category === "rent"
			? ["RENT"]
			: category === "sale"
			? ["SALE"]
			: category === "lease"
			? ["LEASE"]
			: undefined;

	const [feedItems, setFeedItems] = useState<PropertyCardData[]>([]);
	const [feedLoading, setFeedLoading] = useState(true);
	const isVirgin = activeToggles.has("virgin");
	useEffect(() => {
		let cancelled = false;
		setFeedLoading(true);
		propertiesClient
			.list({
				sort: "newest",
				pageSize: 50,
				listingType: listingTypeFilter,
				verifiedOnly: isVirgin || undefined,
			})
			.then((res) => {
				if (cancelled) return;
				setFeedItems(res.items);
				setFeedLoading(false);
			})
			.catch(() => {
				if (cancelled) return;
				setFeedItems([]);
				setFeedLoading(false);
			});
		return () => { cancelled = true; };
	}, [listingTypeFilter?.join(","), isVirgin]);

	// "favs" filters client-side. "price-drops" still needs schema support.
	let filtered = feedItems;
	if (activeToggles.has("favs")) {
		filtered = filtered.filter((p) => isFavourited(p.id));
	}

	const pillBase =
		"inline-flex items-center gap-1.5 h-[38px] rounded-full border px-4 text-[14px] whitespace-nowrap transition-colors cursor-pointer select-none";
	const pillInactive =
		"border-black/15 bg-white text-black/80 hover:bg-black/[0.04]";
	const pillActive =
		"bg-[#ffe5e5] border-[#af2525]/30 text-[#af2525]";

	return (
		<div className="w-full px-3 md:px-8 pt-6 md:pt-10 pb-10 md:pb-14">
			<div className="mx-auto max-w-[1200px]">
				{/* Top row: heading left, search right (desktop) — stacked on mobile */}
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 md:mb-8">
					<h1 className="text-[28px] md:text-[32px] font-semibold text-[#161515] leading-none flex-shrink-0">
						Feed
					</h1>

					{/* Search bar — autocomplete; pick or Enter navigates to /properties */}
					<div className="w-full lg:flex-1 lg:max-w-[480px]">
						<LocationAutocomplete
							onPick={(node) => router.push(nodeToSearchUrl(node))}
							onEnterFallback={(q) => router.push(resolveTextToUrl(q))}
							placeholder="City, Address, neighbourhood…"
							shellClassName="flex items-center gap-3 rounded-[40px] border border-[rgba(186,186,186,0.65)] bg-white px-4 md:px-5 h-[48px] md:h-[52px]"
							inputClassName="flex-1 bg-transparent text-[15px] font-normal text-black outline-none placeholder:text-[rgba(10,10,10,0.4)]"
							leadingSlot={
								<div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-[#af2525]">
									<Search className="h-[14px] w-[14px] text-white" strokeWidth={2.5} />
								</div>
							}
						/>
					</div>
				</div>

				{/* Sentinel — once this scrolls above the header, the header reveals its search */}
				<div ref={sentinelRef} className="h-px w-full" />

				{/* Filter pills row */}
				<div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1 mb-6 md:mb-8">
					{/* All ▾ dropdown pill */}
					<div className="relative flex-shrink-0" ref={categoryDropdownRef}>
						<button
							type="button"
							onClick={() => setCategoryDropdownOpen((o) => !o)}
							className={cn(
								pillBase,
								category === "all" ? pillInactive : pillActive
							)}
						>
							{CATEGORY_LABELS[category]}
							<ChevronDown
								size={14}
								className={cn(
									"transition-transform",
									categoryDropdownOpen && "rotate-180"
								)}
							/>
						</button>

						{categoryDropdownOpen && (
							<div className="absolute top-full mt-2 left-0 w-[180px] rounded-[12px] bg-white border border-black/10 shadow-[0px_4px_17px_0px_rgba(0,0,0,0.12)] py-1.5 z-50">
								{(["all", "rent", "sale", "lease"] as Category[]).map((cat) => (
									<button
										key={cat}
										type="button"
										onClick={() => {
											setCategory(cat);
											setCategoryDropdownOpen(false);
										}}
										className={cn(
											"w-full text-left px-4 py-2.5 text-[14px] transition-colors",
											category === cat
												? "text-[#af2525] bg-[#fff5f5]"
												: "text-[#0a0a0a] hover:bg-black/[0.04]"
										)}
									>
										{cat === "all" ? "All" : `For ${CATEGORY_LABELS[cat]}`}
									</button>
								))}
							</div>
						)}
					</div>

					{/* For Rent shortcut pill */}
					<button
						type="button"
						onClick={() => setCategory(category === "rent" ? "all" : "rent")}
						className={cn(pillBase, "flex-shrink-0", category === "rent" ? pillActive : pillInactive)}
					>
						For Rent
					</button>

					{/* For Sale shortcut pill */}
					<button
						type="button"
						onClick={() => setCategory(category === "sale" ? "all" : "sale")}
						className={cn(pillBase, "flex-shrink-0", category === "sale" ? pillActive : pillInactive)}
					>
						For Sale
					</button>

					{/* For Lease shortcut pill */}
					<button
						type="button"
						onClick={() => setCategory(category === "lease" ? "all" : "lease")}
						className={cn(pillBase, "flex-shrink-0", category === "lease" ? pillActive : pillInactive)}
					>
						For Lease
					</button>

					{/* Toggle pills */}
					{(["latest", "virgin", "price-drops", "favs"] as TogglePill[]).map(
						(pill) => (
							<button
								key={pill}
								type="button"
								onClick={() => togglePill(pill)}
								className={cn(
									pillBase,
									"flex-shrink-0",
									activeToggles.has(pill) ? pillActive : pillInactive
								)}
							>
								{TOGGLE_LABELS[pill]}
							</button>
						)
					)}
				</div>

				{/* Property grid: skeletons while loading, empty state only AFTER load completes */}
				{feedLoading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
						{Array.from({ length: 6 }).map((_, i) => (
							<PropertyCardSkeleton key={i} className="w-full md:w-full" />
						))}
					</div>
				) : filtered.length === 0 ? (
					<div className="w-full rounded-[20px] border border-dashed border-black/10 bg-white/60">
						<EmptyState
							icon={
								<div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#ffcfcf]">
									<CheckCircle2 size={28} className="text-[#af2525]" strokeWidth={1.8} />
								</div>
							}
							title="No properties match your filters"
							description="Try adjusting your filters or clear them to see all available listings."
							action={
								<button
									type="button"
									onClick={clearFilters}
									className="inline-flex h-[44px] items-center justify-center rounded-full bg-[#af2525] px-6 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
								>
									Clear filters
								</button>
							}
						/>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
							{filtered.map((p) => (
								<Link
									key={p.id}
									href={`/property/${p.id}`}
									className="block w-full"
								>
									<PropertyCard
										data={p}
										isFavourited={isFavourited(p.id)}
										onToggleFavourite={toggleFavourite}
										className="w-full md:w-full"
									/>
								</Link>
							))}
						</div>

						{/* End-of-feed marker */}
						<div className="mt-10 md:mt-14 flex flex-col items-center gap-3 border-t border-black/5 pt-8 text-center">
							<div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#ffcfcf]">
								<CheckCircle2 size={24} className="text-[#af2525]" strokeWidth={1.8} />
							</div>

							{hasActiveFilters ? (
								<>
									<h3 className="text-[17px] font-semibold text-[#161515] leading-snug">
										That&apos;s all for {activeFilterLabel()}
									</h3>
									<p className="text-[14px] text-black/50 max-w-[280px]">
										Adjust or clear your filters to see more listings.
									</p>
									<button
										type="button"
										onClick={clearFilters}
										className="inline-flex h-[42px] items-center justify-center rounded-full bg-[#af2525] px-6 text-[14px] font-medium text-white transition-opacity hover:opacity-90 mt-1"
									>
										Clear filters
									</button>
									<button
										type="button"
										onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
										className="text-[13px] text-black/40 underline-offset-2 hover:underline"
									>
										Back to top
									</button>
								</>
							) : (
								<>
									<h3 className="text-[17px] font-semibold text-[#161515] leading-snug">
										You&apos;re all caught up
									</h3>
									<p className="text-[14px] text-black/50 max-w-[260px]">
										Check back later for new listings.
									</p>
									<button
										type="button"
										onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
										className="inline-flex h-[40px] items-center justify-center rounded-full border border-black/15 px-5 text-[14px] text-black/70 transition-colors hover:bg-black/[0.04] mt-1"
									>
										Back to top
									</button>
								</>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
