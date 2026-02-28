import { create } from "zustand";
import type { PropertyType, Furnishing } from "@/types";

interface FilterState {
	city: string;
	area: string;
	propertyType: PropertyType[];
	minPrice: number | undefined;
	maxPrice: number | undefined;
	bedrooms: number[];
	furnishing: Furnishing[];
	amenities: string[];
	verifiedOnly: boolean;
	sortBy: "price_asc" | "price_desc" | "newest" | "most_viewed";

	// Actions
	setCity: (city: string) => void;
	setArea: (area: string) => void;
	togglePropertyType: (type: PropertyType) => void;
	setPriceRange: (min?: number, max?: number) => void;
	toggleBedroom: (count: number) => void;
	toggleFurnishing: (type: Furnishing) => void;
	toggleAmenity: (amenity: string) => void;
	setVerifiedOnly: (verified: boolean) => void;
	setSortBy: (sort: FilterState["sortBy"]) => void;
	resetFilters: () => void;
	activeFilterCount: () => number;
}

const initialState = {
	city: "Uyo",
	area: "",
	propertyType: [] as PropertyType[],
	minPrice: undefined as number | undefined,
	maxPrice: undefined as number | undefined,
	bedrooms: [] as number[],
	furnishing: [] as Furnishing[],
	amenities: [] as string[],
	verifiedOnly: false,
	sortBy: "newest" as const,
};

export const useFilterStore = create<FilterState>((set, get) => ({
	...initialState,

	setCity: (city) => set({ city }),
	setArea: (area) => set({ area }),

	togglePropertyType: (type) =>
		set((state) => ({
			propertyType: state.propertyType.includes(type)
				? state.propertyType.filter((t) => t !== type)
				: [...state.propertyType, type],
		})),

	setPriceRange: (min, max) => set({ minPrice: min, maxPrice: max }),

	toggleBedroom: (count) =>
		set((state) => ({
			bedrooms: state.bedrooms.includes(count)
				? state.bedrooms.filter((b) => b !== count)
				: [...state.bedrooms, count],
		})),

	toggleFurnishing: (type) =>
		set((state) => ({
			furnishing: state.furnishing.includes(type)
				? state.furnishing.filter((f) => f !== type)
				: [...state.furnishing, type],
		})),

	toggleAmenity: (amenity) =>
		set((state) => ({
			amenities: state.amenities.includes(amenity)
				? state.amenities.filter((a) => a !== amenity)
				: [...state.amenities, amenity],
		})),

	setVerifiedOnly: (verified) => set({ verifiedOnly: verified }),
	setSortBy: (sortBy) => set({ sortBy }),

	resetFilters: () => set(initialState),

	activeFilterCount: () => {
		const state = get();
		let count = 0;
		if (state.propertyType.length) count++;
		if (state.minPrice || state.maxPrice) count++;
		if (state.bedrooms.length) count++;
		if (state.furnishing.length) count++;
		if (state.amenities.length) count++;
		if (state.verifiedOnly) count++;
		if (state.area) count++;
		return count;
	},
}));
