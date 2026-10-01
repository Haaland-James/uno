import { findBySlug } from "@/lib/coverage";
import { criteriaToSearchState } from "@/lib/saved-search-mapper";
import { searchStateToApiParams } from "@/lib/search-url";
import { propertyListQuerySchema } from "@/lib/validators/property-query";
import { savedSearchCriteriaSchema } from "@/lib/validators/saved-search";
import type { PropertyWhereQuery } from "@/lib/property-where";

/**
 * Turn a stored SavedSearch.criteria into the query object the search API uses,
 * so a saved search matches exactly what its page shows.
 *
 * It reuses the page's own path (criteria → SearchState → API params) and then
 * the API's own parser, so enum values and coercion behave identically. `sort`,
 * `page` and `pageSize` are dropped: the matcher only counts, it never ranks.
 *
 * Returns null for criteria that cannot be trusted to mean what the user saved:
 * a payload that fails to parse, or a location slug that no longer resolves
 * (dropping it would silently widen the search to every listing, and then email
 * the owner about all of them). The caller skips those and logs.
 */
export function criteriaToQuery(rawCriteria: unknown): PropertyWhereQuery | null {
  const parsed = savedSearchCriteriaSchema.safeParse(rawCriteria);
  if (!parsed.success) return null;
  const c = parsed.data;

  for (const slug of [c.stateSlug, c.citySlug, c.areaSlug]) {
    if (slug && !findBySlug(slug)) return null;
  }

  const state = { beds: [], baths: [], type: [], furnishing: [], amenities: [], verifiedOnly: false, availableNow: false, page: 1, ...criteriaToSearchState(c) };
  const params = searchStateToApiParams(state);

  // Same flattening the browser client does before calling GET /api/properties.
  const record: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    record[k] = Array.isArray(v) ? v.join(",") : String(v);
  }

  const query = propertyListQuerySchema.safeParse(record);
  if (!query.success) return null;

  const { page: _page, pageSize: _pageSize, sort: _sort, ...filters } = query.data;
  return filters;
}
