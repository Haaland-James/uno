import type { Property } from "@prisma/client";
import { db } from "@/lib/db";
import { notDeleted } from "@/lib/property-status";

/** The page shows 3 to 6 similar homes: top up until there are at least this many. */
export const MIN_SIMILAR = 3;

type Seed = Pick<Property, "area" | "city" | "propertyType" | "rent" | "listingType">;

/**
 * Homes similar to `id`, best matches first, never including the listing itself,
 * non-ACTIVE or deleted listings, and never the same listing twice.
 *
 * Starts with the strongest matches (same area, or same city + type within ±40% of
 * the price). If that gives fewer than MIN_SIMILAR, widens step by step and tops up,
 * newest first: same area → same city and type → same city → same listing type
 * anywhere. Every step keeps the seed's listing type (renters comparing rentals
 * shouldn't be shown sales). If the whole site has fewer than MIN_SIMILAR other
 * listings, returns whatever there is.
 */
export async function findSimilarProperties(seed: Seed, id: string, limit: number) {
	const priceMin = Math.floor(seed.rent * 0.6);
	const priceMax = Math.ceil(seed.rent * 1.4);

	const baseWhere = {
		...notDeleted,
		status: "ACTIVE" as const,
		listingType: seed.listingType,
	};
	const include = { photos: { orderBy: { order: "asc" as const } } };

	let items = await db.property.findMany({
		where: {
			...baseWhere,
			id: { not: id },
			OR: [
				{ area: seed.area, city: seed.city },
				{ city: seed.city, propertyType: seed.propertyType, rent: { gte: priceMin, lte: priceMax } },
			],
		},
		orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }],
		take: limit,
		include,
	});

	const widening = [
		{ area: seed.area, city: seed.city },
		{ city: seed.city, propertyType: seed.propertyType },
		{ city: seed.city },
		{},
	];
	for (const step of widening) {
		if (items.length >= MIN_SIMILAR) break;
		const extra = await db.property.findMany({
			where: { ...baseWhere, ...step, id: { notIn: [id, ...items.map((p) => p.id)] } },
			orderBy: { createdAt: "desc" },
			take: limit - items.length,
			include,
		});
		items = [...items, ...extra];
	}
	return items;
}
