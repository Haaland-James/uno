import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { toCardDto } from "@/lib/property-mappers";
import type { PropertyStatus as UiStatus } from "@/types/property";

/**
 * Owner's listings + drafts. Powers `/listing/properties` (My Listings) and the
 * Sidebar/MobileDrawer gate hook.
 *
 * Returns a unified `items` array of cards. Each item has `kind: "property"|"draft"`
 * so the page can branch on actions (drafts route through /api/me/drafts/[id]).
 *
 * Query: `?count=1` — short-circuit returning `{ count }` only. Used by useHasListings.
 *        Counts properties + drafts together (any in-flight listing surfaces the menu).
 */
export async function GET(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return err("unauthorized", "Sign in to view your listings", 401);
	}

	const countOnly = req.nextUrl.searchParams.get("count") === "1";

	if (countOnly) {
		const [propertyCount, draftCount] = await Promise.all([
			db.property.count({ where: { landlordId: session.user.id, deletedAt: null } }),
			db.propertyDraft.count({ where: { userId: session.user.id } }),
		]);
		return ok({ count: propertyCount + draftCount });
	}

	const [properties, drafts] = await Promise.all([
		db.property.findMany({
			where: { landlordId: session.user.id, deletedAt: null },
			orderBy: { createdAt: "desc" },
			include: { photos: { orderBy: { order: "asc" } } },
		}),
		db.propertyDraft.findMany({
			where: { userId: session.user.id },
			orderBy: { updatedAt: "desc" },
		}),
	]);

	const propertyCards = properties.map((p) => ({
		kind: "property" as const,
		...toCardDto(p, false, { revealAddress: true }),
		// Owner-only fields
		status: dbStatusToUi(p.status),
		views: p.views,
		inquiryCount: p.contactCount,
		savedCount: p.savedCount,
		streetAddress: p.streetAddress ?? undefined,
	}));

	const draftCards = drafts.map((d) => ({
		kind: "draft" as const,
		id: d.id,
		title: d.titleHint ?? "Untitled draft",
		propertyType: "FLAT" as const, // unused for drafts; satisfies type
		bedrooms: 0,
		bathrooms: 0,
		area: "",
		city: "",
		rent: 0,
		rentPeriod: "YEAR" as const,
		currency: "NGN",
		negotiable: false,
		amenities: [] as string[],
		photos: d.mainPhotoUrl
			? [{ url: d.mainPhotoUrl, isMain: true }]
			: [],
		verificationStatus: "IN_PROGRESS" as const,
		availabilityStatus: "AVAILABLE_NOW" as const,
		isFavourited: false,
		createdAt: d.createdAt,
		status: "AVAILABLE" as const,
		streetAddress: d.addressHint ?? undefined,
	}));

	// Drafts first, then properties (newest of each interleaved by createdAt/updatedAt
	// but drafts always appear in the AVAILABLE bucket up top — matches Airbnb).
	const items = [...draftCards, ...propertyCards];

	return ok({ items, total: items.length });
}

/**
 * Map Prisma's PropertyStatus to the UI tab buckets the My Listings page renders.
 *  DRAFT/PENDING/REJECTED → AVAILABLE  (the user's "needs attention / drafts" bucket)
 *  ACTIVE                 → PUBLISHED
 *  PAUSED/RENTED          → UNPUBLISHED
 */
function dbStatusToUi(s: string): UiStatus {
	switch (s) {
		case "ACTIVE":
			return "PUBLISHED";
		case "PAUSED":
		case "RENTED":
			return "UNPUBLISHED";
		default:
			return "AVAILABLE";
	}
}
