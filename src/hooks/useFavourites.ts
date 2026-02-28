"use client";

import { useState, useCallback } from "react";
import type { PropertyCardData } from "@/types";

export function useFavourites() {
	const [favourites, setFavourites] = useState<Set<string>>(
		new Set(["prop_002", "prop_007"]) // Mock initial favourites
	);

	const toggleFavourite = useCallback((propertyId: string) => {
		setFavourites((prev) => {
			const next = new Set(prev);
			if (next.has(propertyId)) {
				next.delete(propertyId);
			} else {
				next.add(propertyId);
			}
			return next;
		});
	}, []);

	const isFavourited = useCallback(
		(propertyId: string) => favourites.has(propertyId),
		[favourites]
	);

	return {
		favourites,
		favouriteCount: favourites.size,
		toggleFavourite,
		isFavourited,
	};
}
