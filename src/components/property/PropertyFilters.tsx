"use client";

import { SlidersHorizontal, ChevronDown, X, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilterStore } from "@/stores/filterStore";
import { PROPERTY_TYPES, PRICE_RANGES, BEDROOM_OPTIONS } from "@/../config/constants";

export function PropertyFilters() {
	const filters = useFilterStore();
	const activeCount = filters.activeFilterCount();

	return (
		<div className="space-y-3">
			{/* Scrollable Filter Chips */}
			<div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-page-mobile px-page-mobile md:-mx-0 md:px-0">
				{/* All Filters Button */}
				<button
					className={cn(
						"flex items-center gap-1.5 px-3 py-2 rounded-full border text-small font-medium whitespace-nowrap transition-colors",
						activeCount > 0
							? "border-uno-red bg-uno-red-50 text-uno-red"
							: "border-gray-200 bg-white text-content-secondary hover:border-gray-300"
					)}
				>
					<SlidersHorizontal className="h-3.5 w-3.5" />
					<span>Filters</span>
					{activeCount > 0 && (
						<span className="flex items-center justify-center h-4 w-4 rounded-full bg-uno-red text-white text-[10px] font-bold">
							{activeCount}
						</span>
					)}
				</button>

				{/* Price Filter */}
				<button
					className={cn(
						"flex items-center gap-1 px-3 py-2 rounded-full border text-small font-medium whitespace-nowrap transition-colors",
						filters.minPrice || filters.maxPrice
							? "border-uno-red bg-uno-red-50 text-uno-red"
							: "border-gray-200 bg-white text-content-secondary hover:border-gray-300"
					)}
				>
					<span>Price</span>
					<ChevronDown className="h-3 w-3" />
				</button>

				{/* Bedrooms Filter */}
				<button
					className={cn(
						"flex items-center gap-1 px-3 py-2 rounded-full border text-small font-medium whitespace-nowrap transition-colors",
						filters.bedrooms.length > 0
							? "border-uno-red bg-uno-red-50 text-uno-red"
							: "border-gray-200 bg-white text-content-secondary hover:border-gray-300"
					)}
				>
					<span>Beds</span>
					<ChevronDown className="h-3 w-3" />
				</button>

				{/* Type Filter */}
				<button
					className={cn(
						"flex items-center gap-1 px-3 py-2 rounded-full border text-small font-medium whitespace-nowrap transition-colors",
						filters.propertyType.length > 0
							? "border-uno-red bg-uno-red-50 text-uno-red"
							: "border-gray-200 bg-white text-content-secondary hover:border-gray-300"
					)}
				>
					<span>Type</span>
					<ChevronDown className="h-3 w-3" />
				</button>

				{/* Verified Toggle */}
				<button
					onClick={() => filters.setVerifiedOnly(!filters.verifiedOnly)}
					className={cn(
						"flex items-center gap-1 px-3 py-2 rounded-full border text-small font-medium whitespace-nowrap transition-colors",
						filters.verifiedOnly
							? "border-verified bg-verified/10 text-verified"
							: "border-gray-200 bg-white text-content-secondary hover:border-gray-300"
					)}
				>
					<BadgeCheck className="h-3.5 w-3.5" />
					<span>Verified</span>
				</button>
			</div>

			{/* Active Filters Display */}
			{activeCount > 0 && (
				<div className="flex items-center gap-2">
					<span className="text-tiny text-content-muted">Active:</span>
					<button
						onClick={() => filters.resetFilters()}
						className="flex items-center gap-1 text-tiny text-uno-red hover:text-uno-red-dark font-medium transition-colors"
					>
						<X className="h-3 w-3" />
						Clear all
					</button>
				</div>
			)}
		</div>
	);
}
