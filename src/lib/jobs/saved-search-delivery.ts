import { db } from "@/lib/db";
import { runSavedSearchMatch } from "./saved-search-match";
import { sendBestEffort, sendSavedSearchMatchesEmail } from "@/lib/email";
import type { MatchedSearchGroup } from "@/lib/email/saved-search-matches";
import { buildSearchUrl } from "@/lib/search-url";
import { criteriaToSearchState } from "@/lib/saved-search-mapper";
import type { SavedSearchCriteria } from "@/lib/validators/saved-search";

/** One search's new listings, as returned by runSavedSearchMatch (newest first). */
export type MatchResult = { searchId: string; userId: string; newListingIds: string[] };

export type DeliverySummary = {
	/** Users who had at least one search with new matches. */
	users: number;
	emailed: number;
	/** Send attempts that threw. The watermark is already moved, so these are not retried. */
	failed: number;
	/** Users with matches but nothing to send (a toggle is off, deactivated, no email, listings gone). */
	skipped: number;
};

const MAX_LISTINGS_PER_SEARCH = 5;

/**
 * Email people about the matches `runSavedSearchMatch` just counted.
 *
 * Runs after the watermark and the badge were updated, so it can only ever cost a
 * missed email, never a duplicate (QStash retries re-run the matcher, which finds
 * nothing new). A failed send is logged and counted; it never fails the job.
 *
 * A search is emailed only if it has `notifyEmail` and `notifyInstant`, and its
 * owner has `notifyNewProperties`, is not deactivated and has an email. The badge
 * count does not depend on any of that: it was already bumped by the matcher.
 */
export async function deliverSavedSearchMatches(results: MatchResult[]): Promise<DeliverySummary> {
	const summary: DeliverySummary = { users: 0, emailed: 0, failed: 0, skipped: 0 };
	if (results.length === 0) return summary;

	const searches = await db.savedSearch.findMany({
		where: { id: { in: results.map((r) => r.searchId) } },
		select: {
			id: true,
			name: true,
			criteria: true,
			notifyEmail: true,
			notifyInstant: true,
			user: { select: { id: true, name: true, email: true, notifyNewProperties: true, deactivatedAt: true } },
		},
	});
	const byId = new Map(searches.map((s) => [s.id, s]));

	// Group the eligible searches by user: one email per user per run.
	type Entry = { to: string; name: string | null; items: { search: (typeof searches)[number]; ids: string[] }[] };
	const perUser = new Map<string, Entry>();
	const usersWithMatches = new Set<string>();
	for (const result of results) {
		usersWithMatches.add(result.userId);
		const search = byId.get(result.searchId);
		if (!search || result.newListingIds.length === 0) continue;
		const u = search.user;
		const eligible = search.notifyEmail && search.notifyInstant && u.notifyNewProperties && !u.deactivatedAt && !!u.email;
		if (!eligible) continue;
		const entry = perUser.get(u.id) ?? { to: u.email, name: u.name, items: [] };
		entry.items.push({ search, ids: result.newListingIds });
		perUser.set(u.id, entry);
	}
	summary.users = usersWithMatches.size;
	summary.skipped = usersWithMatches.size - perUser.size;

	// Load the few listings we will actually show, once, and only if still live.
	const shownIds = Array.from(
		new Set(Array.from(perUser.values()).flatMap((e) => e.items.flatMap((i) => i.ids.slice(0, MAX_LISTINGS_PER_SEARCH)))),
	);
	const properties = shownIds.length
		? await db.property.findMany({
				where: { id: { in: shownIds }, status: "ACTIVE", deletedAt: null },
				select: {
					id: true, title: true, area: true, city: true, rent: true, rentPeriod: true, listingType: true,
					photos: { orderBy: [{ isMain: "desc" }, { order: "asc" }], take: 1, select: { url: true } },
				},
			})
		: [];
	const propertyById = new Map(properties.map((p) => [p.id, p]));

	for (const [userId, entry] of Array.from(perUser.entries())) {
		const groups: MatchedSearchGroup[] = [];
		for (const { search, ids } of entry.items) {
			const listings = ids
				.slice(0, MAX_LISTINGS_PER_SEARCH)
				.map((id) => propertyById.get(id))
				.filter((p): p is NonNullable<typeof p> => !!p)
				.map((p) => ({
					id: p.id, title: p.title, area: p.area, city: p.city,
					listingType: p.listingType, rent: p.rent, rentPeriod: p.rentPeriod,
					photoUrl: p.photos[0]?.url ?? null,
				}));
			if (listings.length === 0) continue; // everything shown has since been paused or deleted
			groups.push({
				searchName: search.name,
				total: ids.length,
				listings,
				resultsPath: resultsPath(search.criteria),
			});
		}
		if (groups.length === 0) {
			summary.skipped++;
			continue;
		}

		let sent = false;
		await sendBestEffort(async () => {
			await sendSavedSearchMatchesEmail({ to: entry.to, name: entry.name, groups });
			sent = true;
		}, `saved-search matches for user ${userId}`);
		if (sent) summary.emailed++;
		else summary.failed++;
	}
	return summary;
}

/** The results page for a saved search's criteria; "/properties" if the criteria can't be read. */
function resultsPath(criteria: unknown): string {
	try {
		return buildSearchUrl(criteriaToSearchState(criteria as SavedSearchCriteria));
	} catch {
		return "/properties";
	}
}

export type SavedSearchJobSummary = { scanned: number; matched: number; delivery: DeliverySummary };

/**
 * The scheduled job: count new matches (which moves the watermark and bumps each
 * search's badge), then email the people who asked for it. The matcher's per-search
 * ids stay inside the process; only counts go back to QStash.
 */
export async function runSavedSearchMatchAndDeliver(now: Date): Promise<SavedSearchJobSummary> {
	const { scanned, matched, results } = await runSavedSearchMatch(now);
	const delivery = await deliverSavedSearchMatches(results);
	return { scanned, matched, delivery };
}
