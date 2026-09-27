import type { ListingType, RentPeriod } from "@prisma/client";

export type PricePoint = {
	rent: number;
	rentPeriod: RentPeriod;
	listingType: ListingType;
};

/**
 * True when an edit moves the listing to a different price point. A save that
 * resends the same values must not write a PriceHistory row, or item 23 would
 * see phantom "changes".
 */
export function priceChanged(before: PricePoint, after: PricePoint): boolean {
	return (
		before.rent !== after.rent ||
		before.rentPeriod !== after.rentPeriod ||
		before.listingType !== after.listingType
	);
}
