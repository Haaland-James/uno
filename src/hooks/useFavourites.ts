"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAuthModalStore } from "@/stores/authModalStore";

export function useFavourites() {
	const { status } = useSession();
	const openLogin = useAuthModalStore((s) => s.openLogin);

	const [favourites, setFavourites] = useState<Set<string>>(
		new Set(["prop_002", "prop_007"]) // Mock initial favourites
	);

	const toggleFavourite = useCallback(
		(propertyId: string) => {
			// Guests must sign in first; modal captures the intent so we can replay
			// the favourite once Stage 3 wires up the persistent /api/favourites endpoint.
			if (status !== "authenticated") {
				openLogin({ type: "favourite", propertyId });
				return;
			}
			setFavourites((prev) => {
				const next = new Set(prev);
				if (next.has(propertyId)) {
					next.delete(propertyId);
				} else {
					next.add(propertyId);
				}
				return next;
			});
		},
		[status, openLogin]
	);

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
