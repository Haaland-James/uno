"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Heart, ArrowUpDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
// TODO Stage 3 Phase C: replace mock with `GET /api/favourites` once endpoint exists
import { mockProperties } from "@/lib/mock-data";
import { useFavourites } from "@/hooks/useFavourites";
import { PropertyCard } from "@/components/property/PropertyCard";
import { UnfavouriteConfirmDialog } from "@/components/property/UnfavouriteConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import type { PropertyCardData, PropertyType } from "@/types/property";

type TypeFilter = "all" | "rent" | "sale" | "lease";
type BedsFilter = "any" | "1" | "2" | "3" | "4";
type PropFilter = "any" | PropertyType;
type PriceFilter = "any" | "lt500" | "500-1m" | "1m-5m" | "gt5m";
type SortBy = "newest" | "price_asc" | "price_desc";

const TYPE_LABELS: Record<TypeFilter, string> = {
	all: "Type",
	rent: "For Rent",
	sale: "For Sale",
	lease: "For Lease",
};

const BEDS_LABELS: Record<BedsFilter, string> = {
	any: "Beds / Bath",
	"1": "1+ beds",
	"2": "2+ beds",
	"3": "3+ beds",
	"4": "4+ beds",
};

const PROP_LABELS: Record<PropFilter, string> = {
	any: "Property",
	FLAT: "Flat",
	HOUSE: "House",
	DUPLEX: "Duplex",
	SELF_CONTAIN: "Self-Contain",
	BUNGALOW: "Bungalow",
	COMMERCIAL: "Commercial",
	LAND: "Land",
};

const PRICE_LABELS: Record<PriceFilter, string> = {
	any: "Price",
	lt500: "≤ ₦500k",
	"500-1m": "₦500k – ₦1M",
	"1m-5m": "₦1M – ₦5M",
	gt5m: "₦5M+",
};

const SORT_LABELS: Record<SortBy, string> = {
	newest: "Newest",
	price_asc: "Price: Low to High",
	price_desc: "Price: High to Low",
};

const pillBase =
	"inline-flex items-center gap-1.5 h-[38px] rounded-full border px-4 text-[14px] whitespace-nowrap transition-colors cursor-pointer select-none focus:outline-none";
const pillInactive = "border-black/15 bg-white text-black/80 hover:bg-black/[0.04]";
const pillActive = "bg-[#ffe5e5] border-[#af2525]/30 text-[#af2525]";

function priceMatches(rent: number, filter: PriceFilter): boolean {
	switch (filter) {
		case "any":
			return true;
		case "lt500":
			return rent <= 500_000;
		case "500-1m":
			return rent > 500_000 && rent <= 1_000_000;
		case "1m-5m":
			return rent > 1_000_000 && rent <= 5_000_000;
		case "gt5m":
			return rent > 5_000_000;
	}
}

function bedsMatches(bedrooms: number, filter: BedsFilter): boolean {
	if (filter === "any") return true;
	return bedrooms >= parseInt(filter, 10);
}

function typeMatches(_p: PropertyCardData, filter: TypeFilter): boolean {
	// Mock data currently only contains rentals (rentPeriod = YEAR/MONTH).
	// "all" and "rent" pass through; "sale" and "lease" intentionally match nothing
	// so the filter UI is honest about what data is available.
	if (filter === "all" || filter === "rent") return true;
	return false;
}

export default function FavouritesPage() {
	const { isFavourited, toggleFavourite } = useFavourites();

	const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
	const [bedsFilter, setBedsFilter] = useState<BedsFilter>("any");
	const [propFilter, setPropFilter] = useState<PropFilter>("any");
	const [priceFilter, setPriceFilter] = useState<PriceFilter>("any");
	const [sortBy, setSortBy] = useState<SortBy>("newest");

	const [openDropdown, setOpenDropdown] = useState<
		"type" | "beds" | "prop" | "price" | "sort" | null
	>(null);
	const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

	const rowRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!openDropdown) return;
		const onClick = (e: MouseEvent) => {
			if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
				setOpenDropdown(null);
			}
		};
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [openDropdown]);

	const favedProperties = useMemo(
		() => mockProperties.filter((p) => isFavourited(p.id)),
		[isFavourited]
	);

	const filtered = useMemo(() => {
		const list = favedProperties.filter(
			(p) =>
				typeMatches(p, typeFilter) &&
				bedsMatches(p.bedrooms, bedsFilter) &&
				(propFilter === "any" || p.propertyType === propFilter) &&
				priceMatches(p.rent, priceFilter)
		);
		const sorted = [...list];
		if (sortBy === "price_asc") sorted.sort((a, b) => a.rent - b.rent);
		else if (sortBy === "price_desc") sorted.sort((a, b) => b.rent - a.rent);
		else sorted.sort((a, b) => +b.createdAt - +a.createdAt);
		return sorted;
	}, [favedProperties, typeFilter, bedsFilter, propFilter, priceFilter, sortBy]);

	const clearFilters = () => {
		setTypeFilter("all");
		setBedsFilter("any");
		setPropFilter("any");
		setPriceFilter("any");
	};

	const handleRequestUnfavourite = (id: string) => {
		setPendingRemoval(id);
	};

	const confirmRemoval = () => {
		if (pendingRemoval) toggleFavourite(pendingRemoval);
		setPendingRemoval(null);
	};

	const hasAnyFavourites = favedProperties.length > 0;

	return (
		<div className="w-full px-3 md:px-8 pt-6 md:pt-10 pb-10 md:pb-14">
			<div className="mx-auto max-w-[1200px]">
				{/* Heading */}
				<div className="flex items-center gap-3 mb-6 md:mb-8">
					<div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-[#af2525]">
						<Heart size={16} className="fill-white text-white" />
					</div>
					<h1 className="text-[24px] md:text-[32px] font-semibold text-[#161515] leading-none">
						Your Favourites
					</h1>
				</div>

				{hasAnyFavourites && (
					<div
						ref={rowRef}
						className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 md:mx-0 md:px-0 pb-1 mb-6 md:mb-8"
					>
						{/* Type */}
						<Dropdown
							label={TYPE_LABELS[typeFilter]}
							active={typeFilter !== "all"}
							open={openDropdown === "type"}
							onToggle={() =>
								setOpenDropdown(openDropdown === "type" ? null : "type")
							}
						>
							{(Object.keys(TYPE_LABELS) as TypeFilter[]).map((v) => (
								<DropdownItem
									key={v}
									selected={typeFilter === v}
									onClick={() => {
										setTypeFilter(v);
										setOpenDropdown(null);
									}}
								>
									{v === "all" ? "All" : TYPE_LABELS[v]}
								</DropdownItem>
							))}
						</Dropdown>

						{/* Beds */}
						<Dropdown
							label={BEDS_LABELS[bedsFilter]}
							active={bedsFilter !== "any"}
							open={openDropdown === "beds"}
							onToggle={() =>
								setOpenDropdown(openDropdown === "beds" ? null : "beds")
							}
						>
							{(Object.keys(BEDS_LABELS) as BedsFilter[]).map((v) => (
								<DropdownItem
									key={v}
									selected={bedsFilter === v}
									onClick={() => {
										setBedsFilter(v);
										setOpenDropdown(null);
									}}
								>
									{v === "any" ? "Any" : BEDS_LABELS[v]}
								</DropdownItem>
							))}
						</Dropdown>

						{/* Property type */}
						<Dropdown
							label={PROP_LABELS[propFilter]}
							active={propFilter !== "any"}
							open={openDropdown === "prop"}
							onToggle={() =>
								setOpenDropdown(openDropdown === "prop" ? null : "prop")
							}
						>
							{(Object.keys(PROP_LABELS) as PropFilter[]).map((v) => (
								<DropdownItem
									key={v}
									selected={propFilter === v}
									onClick={() => {
										setPropFilter(v);
										setOpenDropdown(null);
									}}
								>
									{v === "any" ? "Any" : PROP_LABELS[v]}
								</DropdownItem>
							))}
						</Dropdown>

						{/* Price */}
						<Dropdown
							label={PRICE_LABELS[priceFilter]}
							active={priceFilter !== "any"}
							open={openDropdown === "price"}
							onToggle={() =>
								setOpenDropdown(openDropdown === "price" ? null : "price")
							}
						>
							{(Object.keys(PRICE_LABELS) as PriceFilter[]).map((v) => (
								<DropdownItem
									key={v}
									selected={priceFilter === v}
									onClick={() => {
										setPriceFilter(v);
										setOpenDropdown(null);
									}}
								>
									{v === "any" ? "Any" : PRICE_LABELS[v]}
								</DropdownItem>
							))}
						</Dropdown>

						{/* Sort (right aligned on desktop) */}
						<div className="relative flex-shrink-0 md:ml-auto">
							<button
								type="button"
								onClick={() =>
									setOpenDropdown(openDropdown === "sort" ? null : "sort")
								}
								className="inline-flex items-center gap-2 h-[38px] px-2 text-[14px] text-black/80 whitespace-nowrap focus:outline-none"
							>
								<ArrowUpDown size={14} className="text-black/60" />
								<span className="text-black/60">Sort:</span>
								<span className="text-[#161515]">{SORT_LABELS[sortBy]}</span>
								<ChevronDown
									size={14}
									className={cn(
										"transition-transform",
										openDropdown === "sort" && "rotate-180"
									)}
								/>
							</button>
							{openDropdown === "sort" && (
								<div className="absolute right-0 top-full mt-2 w-[200px] rounded-[12px] bg-white border border-black/10 shadow-[0px_4px_17px_0px_rgba(0,0,0,0.12)] py-1.5 z-50">
									{(Object.keys(SORT_LABELS) as SortBy[]).map((s) => (
										<DropdownItem
											key={s}
											selected={sortBy === s}
											onClick={() => {
												setSortBy(s);
												setOpenDropdown(null);
											}}
										>
											{SORT_LABELS[s]}
										</DropdownItem>
									))}
								</div>
							)}
						</div>
					</div>
				)}

				{/* Content */}
				{!hasAnyFavourites ? (
					<div className="w-full rounded-[20px] border border-dashed border-black/10 bg-white/60">
						<EmptyState
							title="Save Homes Here"
							description={
								<>
									Whenever you find homes you like, select the{" "}
									<Heart
										size={14}
										className="inline fill-[#af2525] text-[#af2525] align-[-1px]"
									/>{" "}
									to save them here.
								</>
							}
							action={
								<Link
									href="/find"
									className="inline-flex h-[44px] items-center justify-center rounded-full bg-[#af2525] px-6 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
								>
									Search for Homes
								</Link>
							}
						/>
					</div>
				) : filtered.length === 0 ? (
					<div className="w-full rounded-[20px] border border-dashed border-black/10 bg-white/60">
						<EmptyState
							icon={
								<div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#ffcfcf]">
									<CheckCircle2
										size={28}
										className="text-[#af2525]"
										strokeWidth={1.8}
									/>
								</div>
							}
							title="No properties match your filters"
							description="Try adjusting your filters or clear them to see all your saved properties."
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
					<div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
						{filtered.map((p) => (
							<Link
								key={p.id}
								href={`/property/${p.id}`}
								className="block w-full"
							>
								<PropertyCard
									data={p}
									isFavourited
									onToggleFavourite={handleRequestUnfavourite}
									className="w-full md:w-full"
								/>
							</Link>
						))}
					</div>
				)}
			</div>

			<UnfavouriteConfirmDialog
				open={pendingRemoval !== null}
				onCancel={() => setPendingRemoval(null)}
				onConfirm={confirmRemoval}
			/>
		</div>
	);
}

// ── small presentational helpers ──

interface DropdownProps {
	label: string;
	active: boolean;
	open: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}

function Dropdown({ label, active, open, onToggle, children }: DropdownProps) {
	return (
		<div className="relative flex-shrink-0">
			<button
				type="button"
				onClick={onToggle}
				className={cn(pillBase, active ? pillActive : pillInactive)}
			>
				{label}
				<ChevronDown
					size={14}
					className={cn("transition-transform", open && "rotate-180")}
				/>
			</button>
			{open && (
				<div className="absolute left-0 top-full mt-2 w-[200px] rounded-[12px] bg-white border border-black/10 shadow-[0px_4px_17px_0px_rgba(0,0,0,0.12)] py-1.5 z-50">
					{children}
				</div>
			)}
		</div>
	);
}

function DropdownItem({
	selected,
	onClick,
	children,
}: {
	selected: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"w-full text-left px-4 py-2.5 text-[14px] transition-colors",
				selected
					? "text-[#af2525] bg-[#fff5f5]"
					: "text-[#0a0a0a] hover:bg-black/[0.04]"
			)}
		>
			{children}
		</button>
	);
}
