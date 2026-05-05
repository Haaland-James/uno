"use client";

import { useCallback, useEffect, useState } from "react";
import { listingsClient } from "@/lib/clients/listings";
import type { PropertyCardData } from "@/types/property";

/** Fetches the signed-in user's listings (all statuses) for /listing/properties. */
export function useMyListings() {
	const [listings, setListings] = useState<PropertyCardData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refetch = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await listingsClient.list();
			setListings(res.items);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Could not load your listings");
			setListings([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		refetch();
	}, [refetch]);

	return { listings, setListings, isLoading, error, refetch };
}
