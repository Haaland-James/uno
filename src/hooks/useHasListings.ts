"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/userStore";
import { listingsClient } from "@/lib/clients/listings";

/**
 * Returns whether the current user has at least one listing. Used by Sidebar and
 * MobileDrawer to gate the "Listings" navigation section. Cached at module scope
 * so the call only fires once per session even with multiple consumers.
 */

let cachedCount: number | null = null;
let inflight: Promise<number> | null = null;
const subscribers = new Set<(count: number) => void>();

function fetchCount(): Promise<number> {
	if (inflight) return inflight;
	inflight = listingsClient
		.count()
		.then((res) => {
			cachedCount = res.count;
			subscribers.forEach((cb) => cb(res.count));
			return res.count;
		})
		.finally(() => {
			inflight = null;
		});
	return inflight;
}

/** Force the cache to refresh — call after a successful POST/DELETE. */
export function invalidateHasListings() {
	cachedCount = null;
	inflight = null;
	subscribers.forEach((cb) => cb(0));
	fetchCount().catch(() => {
		// swallow — subscribers will still see cached value
	});
}

export function useHasListings(): { hasListings: boolean; isLoading: boolean } {
	const user = useUserStore((s) => s.user);
	const [count, setCount] = useState<number | null>(cachedCount);
	const [isLoading, setIsLoading] = useState(cachedCount === null && !!user);

	useEffect(() => {
		if (!user) {
			setCount(0);
			setIsLoading(false);
			return;
		}
		const sub = (n: number) => setCount(n);
		subscribers.add(sub);

		if (cachedCount !== null) {
			setCount(cachedCount);
			setIsLoading(false);
		} else {
			setIsLoading(true);
			fetchCount()
				.catch(() => {
					setCount(0);
				})
				.finally(() => setIsLoading(false));
		}

		return () => {
			subscribers.delete(sub);
		};
	}, [user]);

	return { hasListings: (count ?? 0) > 0, isLoading };
}
