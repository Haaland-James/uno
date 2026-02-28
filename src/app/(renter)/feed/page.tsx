"use client";

import { MapPin, ArrowUpDown } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyFilters } from "@/components/property/PropertyFilters";
import { FeedSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useProperties } from "@/hooks/useProperties";
import { useFavourites } from "@/hooks/useFavourites";
import { useFilterStore } from "@/stores/filterStore";
import { Search } from "lucide-react";
import Link from "next/link";

export default function FeedPage() {
	const { properties, isLoading, totalCount, isEmpty } = useProperties();
	const { isFavourited, toggleFavourite } = useFavourites();
	const city = useFilterStore((s) => s.city);
	const sortBy = useFilterStore((s) => s.sortBy);
	const setSortBy = useFilterStore((s) => s.setSortBy);

	return (
		<div className="page-container py-4 md:py-6">
			{/* Page Header */}
			<div className="flex items-center justify-between mb-4">
				<div>
					<h1 className="text-heading-2 text-content-primary">
						Properties in {city}
					</h1>
					<div className="flex items-center gap-1 text-small text-content-secondary mt-0.5">
						<MapPin className="h-3.5 w-3.5" />
						<span>{totalCount} {totalCount === 1 ? "property" : "properties"} available</span>
					</div>
				</div>

				{/* Sort Dropdown */}
				<button
					className="flex items-center gap-1.5 px-3 py-2 rounded-button border border-gray-200 text-small text-content-secondary hover:border-gray-300 transition-colors"
				>
					<ArrowUpDown className="h-3.5 w-3.5" />
					<span className="hidden sm:inline">Sort by</span>
				</button>
			</div>

			{/* Filters */}
			<div className="mb-6">
				<PropertyFilters />
			</div>

			{/* Results */}
			{isLoading ? (
				<FeedSkeleton />
			) : isEmpty ? (
				<EmptyState
					icon={<Search className="h-12 w-12" />}
					title="No properties found"
					description="Try adjusting your filters or search in a different area."
					action={
						<Link href="/search" className="btn-primary px-6 py-2.5">
							Modify Search
						</Link>
					}
				/>
			) : (
				<div className="feed-grid">
					{properties.map((property) => (
						<Link
							key={property.id}
							href={`/property/${property.id}`}
						>
							<PropertyCard
								property={property}
								isFavourited={isFavourited(property.id)}
								onToggleFavourite={toggleFavourite}
							/>
						</Link>
					))}
				</div>
			)}

			{/* Bottom Spacer for Mobile Nav */}
			<div className="h-4" />
		</div>
	);
}
