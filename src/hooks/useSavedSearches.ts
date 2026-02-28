"use client";

import { useState } from "react";
import type { SavedSearch } from "@/types";

export function useSavedSearches() {
	const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const saveSearch = (name: string, criteria: Record<string, unknown>) => {
		const newSearch: SavedSearch = {
			id: `search_${Date.now()}`,
			userId: "mock_user",
			name,
			criteria,
			isActive: true,
			notifyInstant: true,
			notifyEmail: false,
			newResultsCount: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		setSavedSearches((prev) => [...prev, newSearch]);
	};

	const deleteSearch = (id: string) => {
		setSavedSearches((prev) => prev.filter((s) => s.id !== id));
	};

	const toggleActive = (id: string) => {
		setSavedSearches((prev) =>
			prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
		);
	};

	return {
		savedSearches,
		isLoading,
		saveSearch,
		deleteSearch,
		toggleActive,
	};
}
