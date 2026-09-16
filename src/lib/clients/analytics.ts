async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		...init,
		headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
	});
	const json = await res.json();
	if (!res.ok) {
		const msg = json?.error?.message ?? `Request failed (${res.status})`;
		throw new Error(msg);
	}
	return json.data as T;
}

export type TopListing = {
	id: string;
	title: string;
	city: string;
	area: string;
	status: string;
	views: number;
	contactCount: number;
};

export type AnalyticsResult = {
	totalViews: number;
	totalContacts: number;
	contacts30d: number;
	/** ACTIVE only — matches the "Published" tab on My Listings. */
	publishedListings: number;
	/** Every property, any status. Gates the empty state; not shown as a tile. */
	totalListings: number;
	/** Month keys ("YYYY-MM"), oldest first. */
	months: string[];
	listingsByMonth: Record<string, number>;
	contactsByMonth: Record<string, number>;
	/** Up to 10, most-viewed first. */
	topListings: TopListing[];
};

export const analyticsClient = {
	get: () => getJson<AnalyticsResult>("/api/me/analytics"),
};
