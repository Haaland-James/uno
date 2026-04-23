"use client";

import { useState } from "react";
import type { SavedSearch } from "@/types";

const seedSearches: SavedSearch[] = [
	{
		id: "search_1",
		userId: "mock_user",
		name: "For Rent in Usse, Nwaniba",
		searchType: "For Rent",
		criteria: { city: "Uyo", area: "Usse, Nwaniba" },
		isActive: true,
		notificationsEnabled: true,
		notificationChannels: ["email"],
		notificationFrequency: "instant",
		newResultsCount: 0,
		createdAt: new Date("2026-04-10"),
		updatedAt: new Date("2026-04-10"),
	},
	{
		id: "search_2",
		userId: "mock_user",
		name: "For Rent in Parkview, Uyo",
		searchType: "For Rent",
		criteria: { city: "Uyo", area: "Parkview" },
		isActive: true,
		notificationsEnabled: false,
		notificationChannels: ["email"],
		notificationFrequency: "weekly",
		newResultsCount: 0,
		createdAt: new Date("2026-04-12"),
		updatedAt: new Date("2026-04-12"),
	},
	{
		id: "search_3",
		userId: "mock_user",
		name: "For Rent in Usse, Nwaniba",
		searchType: "For Rent",
		criteria: { city: "Uyo", area: "Usse, Nwaniba" },
		isActive: true,
		notificationsEnabled: true,
		notificationChannels: ["push", "email"],
		notificationFrequency: "daily",
		newResultsCount: 0,
		createdAt: new Date("2026-04-14"),
		updatedAt: new Date("2026-04-14"),
	},
	{
		id: "search_4",
		userId: "mock_user",
		name: "For Sale in Ikot Ekpene, Akwa Ibom",
		searchType: "For Sale",
		criteria: { city: "Ikot Ekpene", area: "" },
		isActive: true,
		notificationsEnabled: false,
		notificationChannels: ["whatsapp"],
		notificationFrequency: "never",
		newResultsCount: 0,
		createdAt: new Date("2026-04-15"),
		updatedAt: new Date("2026-04-15"),
	},
];

export function useSavedSearches() {
	const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(seedSearches);
	const [isLoading] = useState(false);

	const saveSearch = (
		name: string,
		searchType: string,
		criteria: Record<string, unknown>
	) => {
		const newSearch: SavedSearch = {
			id: `search_${Date.now()}`,
			userId: "mock_user",
			name,
			searchType,
			criteria,
			isActive: true,
			notificationsEnabled: true,
			notificationChannels: ["email"],
			notificationFrequency: "instant",
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

	const updateSearch = (id: string, patch: Partial<SavedSearch>) => {
		setSavedSearches((prev) =>
			prev.map((s) =>
				s.id === id ? { ...s, ...patch, updatedAt: new Date() } : s
			)
		);
	};

	return {
		savedSearches,
		isLoading,
		saveSearch,
		deleteSearch,
		toggleActive,
		updateSearch,
	};
}
