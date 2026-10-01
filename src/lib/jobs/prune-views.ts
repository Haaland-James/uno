import { db } from "@/lib/db";

export type PruneViewsSummary = { deleted: number; batches: number; cutoff: string; complete: boolean };

type Options = {
  batchSize?: number;
  /** Stop starting new batches after this long; the next run continues where this one left off. */
  budgetMs?: number;
};

const DEFAULTS = { batchSize: 1000, budgetMs: 20_000 };
export const RETENTION_MONTHS = 13;

/** `months` calendar months before `now` (UTC). Clamps the day, so 31 Mar minus 1 month is 28/29 Feb, not 3 Mar. */
export function monthsBefore(now: Date, months: number): Date {
  const d = new Date(now.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

/**
 * Delete PropertyView rows older than 13 months (enough for a full year-on-year
 * comparison), oldest first, in batches. `Property.views`, the running total that
 * drives "most viewed", is a separate column and is never touched.
 *
 * Safe to run twice: it only deletes rows past the cutoff, so a retry finds
 * nothing left to do. Deletes by id from a bounded batch rather than one big
 * DELETE, so a large backlog never holds a long lock.
 */
export async function pruneViews(now: Date, options: Options = {}): Promise<PruneViewsSummary> {
  const { batchSize, budgetMs } = { ...DEFAULTS, ...options };
  const cutoff = monthsBefore(now, RETENTION_MONTHS);
  const startedAt = Date.now();
  let deleted = 0;
  let batches = 0;

  while (Date.now() - startedAt < budgetMs) {
    const rows = await db.propertyView.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true },
      orderBy: { createdAt: "asc" },
      take: batchSize,
    });
    if (rows.length === 0) return { deleted, batches, cutoff: cutoff.toISOString(), complete: true };

    const { count } = await db.propertyView.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
    deleted += count;
    batches++;
    if (rows.length < batchSize) return { deleted, batches, cutoff: cutoff.toISOString(), complete: true };
  }

  return { deleted, batches, cutoff: cutoff.toISOString(), complete: false };
}
