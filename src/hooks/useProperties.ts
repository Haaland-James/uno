"use client";

import { useState, useMemo } from "react";
import { mockProperties } from "@/lib/mock-data";
import { useFilterStore } from "@/stores/filterStore";
import type { PropertyCardData } from "@/types";

export function useProperties() {
	const [isLoading, setIsLoading] = useState(false);
	const filters = useFilterStore();

	const properties = useMemo(() => {
		let filtered = [...mockProperties];

		// Filter by city
		if (filters.city) {
			filtered = filtered.filter((p) => p.city === filters.city);
		}

		// Filter by area
		if (filters.area) {
			filtered = filtered.filter((p) => p.area === filters.area);
		}

		// Filter by property type
		if (filters.propertyType.length > 0) {
			filtered = filtered.filter((p) =>
				filters.propertyType.includes(p.propertyType)
			);
		}

		// Filter by price range
		if (filters.minPrice) {
			filtered = filtered.filter((p) => p.rent >= filters.minPrice!);
		}
		if (filters.maxPrice) {
			filtered = filtered.filter((p) => p.rent <= filters.maxPrice!);
		}

		// Filter by bedrooms
		if (filters.bedrooms.length > 0) {
			filtered = filtered.filter((p) => filters.bedrooms.includes(p.bedrooms));
		}

		// Filter by amenities
		if (filters.amenities.length > 0) {
			filtered = filtered.filter((p) =>
				filters.amenities.every((a) => p.amenities.includes(a))
			);
		}

		// Filter verified only
		if (filters.verifiedOnly) {
			filtered = filtered.filter(
				(p) => p.verificationStatus === "VERIFIED"
			);
		}

		// Sort
		switch (filters.sortBy) {
			case "price_asc":
				filtered.sort((a, b) => a.rent - b.rent);
				break;
			case "price_desc":
				filtered.sort((a, b) => b.rent - a.rent);
				break;
			case "newest":
				filtered.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
				break;
			case "most_viewed":
				filtered.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
				break;
		}

		return filtered;
	}, [
		filters.city,
		filters.area,
		filters.propertyType,
		filters.minPrice,
		filters.maxPrice,
		filters.bedrooms,
		filters.amenities,
		filters.verifiedOnly,
		filters.sortBy,
	]);

	return {
		properties,
		isLoading,
		totalCount: properties.length,
		isEmpty: properties.length === 0,
	};
}
