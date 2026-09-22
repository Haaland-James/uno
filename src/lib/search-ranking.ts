/** Slice a rank-ordered ID list after applying the unordered query-filter matches. */
export function pageRankedIds(
  rankedIds: string[],
  matchingIds: Iterable<string>,
  skip: number,
  take: number,
): { pageIds: string[]; total: number } {
  const keep = new Set(matchingIds);
  const ordered = rankedIds.filter((id) => keep.has(id));
  return { pageIds: ordered.slice(skip, skip + take), total: ordered.length };
}

/** Restore explicit ID order to unordered rows, dropping IDs with no row. */
export function reorderByIds<T extends { id: string }>(rows: T[], ids: string[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => byId.get(id)).filter((row): row is T => row !== undefined);
}
