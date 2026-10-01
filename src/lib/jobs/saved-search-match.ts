import { db } from "@/lib/db";
import { buildPropertyWhere, findTextMatchIds } from "@/lib/property-where";
import { criteriaToQuery } from "@/lib/saved-search-query";

export type SavedSearchMatchResult = { searchId: string; userId: string; newListingIds: string[] };
export type SavedSearchMatchSummary = { scanned: number; matched: number; results: SavedSearchMatchResult[] };

type Options = {
  batchSize?: number;
  /** Stop starting new batches after this long, so a slow run ends cleanly and the next run continues. */
  budgetMs?: number;
  /** Cap on ids returned per search. The count and the badge still reflect every new match up to this cap. */
  maxIdsPerSearch?: number;
};

const DEFAULTS = { batchSize: 50, budgetMs: 20_000, maxIdsPerSearch: 200 };

/**
 * Count, per active saved search, the listings that went live since it was last
 * checked and match its criteria, and bump its badge (`newResultsCount`).
 *
 * - Oldest-checked first (never-checked first), in batches, within a time budget.
 * - Watermark = `lastCheckedAt`, or the search's own `createdAt` the first time,
 *   so saving a search never reports listings that already existed.
 * - The watermark moves to `now` in the same conditional update that adds to the
 *   badge. The update only applies if `lastCheckedAt` is still what we read, so a
 *   retried or overlapping run cannot count the same listings twice.
 * - Sends no email: returns the new listing ids per search for the delivery step.
 */
export async function runSavedSearchMatch(now: Date, options: Options = {}): Promise<SavedSearchMatchSummary> {
  const { batchSize, budgetMs, maxIdsPerSearch } = { ...DEFAULTS, ...options };
  const startedAt = Date.now();
  const seen: string[] = [];
  const results: SavedSearchMatchResult[] = [];
  let scanned = 0;

  while (Date.now() - startedAt < budgetMs) {
    const batch = await db.savedSearch.findMany({
      where: { isActive: true, user: { deactivatedAt: null }, ...(seen.length && { id: { notIn: seen } }) },
      orderBy: [{ lastCheckedAt: { sort: "asc", nulls: "first" } }, { id: "asc" }],
      take: batchSize,
      select: { id: true, userId: true, criteria: true, lastCheckedAt: true, createdAt: true },
    });
    if (batch.length === 0) break;

    for (const search of batch) {
      seen.push(search.id);
      scanned++;
      try {
        const result = await matchOne(search, now, maxIdsPerSearch);
        if (result) results.push(result);
      } catch (e) {
        // One bad search must not stop the rest. Its watermark is untouched, so it is retried next run.
        console.error("[saved-search-match] search failed", search.id, e);
      }
    }
  }

  return { scanned, matched: results.length, results };
}

async function matchOne(
  search: { id: string; userId: string; criteria: unknown; lastCheckedAt: Date | null; createdAt: Date },
  now: Date,
  maxIds: number,
): Promise<SavedSearchMatchResult | null> {
  const query = criteriaToQuery(search.criteria);
  if (!query) {
    // Broken or stale criteria: skip, and mark it checked so it can't sit at the front of every run.
    console.error("[saved-search-match] skipping search with unusable criteria", search.id);
    await db.savedSearch.updateMany({
      where: { id: search.id, lastCheckedAt: search.lastCheckedAt },
      data: { lastCheckedAt: now },
    });
    return null;
  }

  const since = search.lastCheckedAt ?? search.createdAt;
  const where = buildPropertyWhere(query);
  if (query.q) {
    const text = await findTextMatchIds(query.q);
    where.id = { in: text.ids };
  }

  const rows = await db.property.findMany({
    where: {
      ...where,
      createdAt: { gt: since, lte: now },
      landlordId: { not: search.userId },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: maxIds,
  });
  const newListingIds = rows.map((r) => r.id);

  // Conditional on the watermark we read: if another run got here first, this applies to nothing.
  const { count } = await db.savedSearch.updateMany({
    where: { id: search.id, lastCheckedAt: search.lastCheckedAt },
    data: {
      lastCheckedAt: now,
      ...(newListingIds.length && { newResultsCount: { increment: newListingIds.length } }),
    },
  });
  if (count === 0 || newListingIds.length === 0) return null;

  return { searchId: search.id, userId: search.userId, newListingIds };
}
