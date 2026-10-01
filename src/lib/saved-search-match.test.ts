import { beforeEach, describe, expect, it, vi } from "vitest";

type Search = { id: string; userId: string; criteria: unknown; isActive: boolean; ownerDeactivated: boolean; lastCheckedAt: Date | null; createdAt: Date; newResultsCount: number };
type Listing = { id: string; landlordId: string; city: string; listingType: string; status: string; deletedAt: Date | null; createdAt: Date };

const store = vi.hoisted(() => ({ searches: [] as Search[], listings: [] as Listing[], queryRaw: vi.fn() }));

// A small in-memory stand-in for the two tables, evaluating just the where-clauses the matcher builds.
const matches = (l: Listing, w: Record<string, any>): boolean => {
  if ("status" in w && l.status !== w.status) return false;
  if ("deletedAt" in w && l.deletedAt !== w.deletedAt) return false;
  if (w.listingType?.in && !w.listingType.in.includes(l.listingType)) return false;
  if (w.city?.equals && l.city.toLowerCase() !== String(w.city.equals).toLowerCase()) return false;
  if (w.createdAt?.gt && !(l.createdAt > w.createdAt.gt)) return false;
  if (w.createdAt?.lte && !(l.createdAt <= w.createdAt.lte)) return false;
  if (w.landlordId?.not && l.landlordId === w.landlordId.not) return false;
  if (w.id?.in && !w.id.in.includes(l.id)) return false;
  return true;
};
const sameDate = (a: Date | null, b: Date | null) => (a === null || b === null ? a === b : a.getTime() === b.getTime());

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: store.queryRaw,
    property: {
      findMany: async ({ where, take }: any) =>
        store.listings.filter((l) => matches(l, where)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, take).map((l) => ({ id: l.id })),
    },
    savedSearch: {
      findMany: async ({ where, take }: any) => {
        const skip: string[] = where.id?.notIn ?? [];
        return store.searches
          .filter((s) => s.isActive === where.isActive && !s.ownerDeactivated && !skip.includes(s.id))
          .sort((a, b) => (a.lastCheckedAt?.getTime() ?? -Infinity) - (b.lastCheckedAt?.getTime() ?? -Infinity) || a.id.localeCompare(b.id))
          .slice(0, take)
          .map((s) => ({ id: s.id, userId: s.userId, criteria: s.criteria, lastCheckedAt: s.lastCheckedAt, createdAt: s.createdAt }));
      },
      updateMany: async ({ where, data }: any) => {
        const row = store.searches.find((s) => s.id === where.id && sameDate(s.lastCheckedAt, where.lastCheckedAt));
        if (!row) return { count: 0 };
        row.lastCheckedAt = data.lastCheckedAt;
        if (data.newResultsCount?.increment) row.newResultsCount += data.newResultsCount.increment;
        return { count: 1 };
      },
    },
  },
}));
import { runSavedSearchMatch } from "./jobs/saved-search-match";

const T = (iso: string) => new Date(iso);
const NOW = T("2026-10-01T12:00:00Z");
const rentInUyo = { v: 1, category: "rent", citySlug: "uyo" };
const search = (over: Partial<Search> = {}): Search => ({
  id: "s1", userId: "renter", criteria: rentInUyo, isActive: true, ownerDeactivated: false,
  lastCheckedAt: T("2026-10-01T10:00:00Z"), createdAt: T("2026-09-20T00:00:00Z"), newResultsCount: 0, ...over,
});
const listing = (over: Partial<Listing> = {}): Listing => ({
  id: "l1", landlordId: "someone-else", city: "Uyo", listingType: "RENT", status: "ACTIVE", deletedAt: null, createdAt: T("2026-10-01T11:00:00Z"), ...over,
});

beforeEach(() => {
  store.searches = [];
  store.listings = [];
  store.queryRaw.mockReset();
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("runSavedSearchMatch", () => {
  it("counts a new matching listing and returns its id", async () => {
    store.searches = [search()];
    store.listings = [listing()];
    const out = await runSavedSearchMatch(NOW);
    expect(out).toEqual({ scanned: 1, matched: 1, results: [{ searchId: "s1", userId: "renter", newListingIds: ["l1"] }] });
    expect(store.searches[0]).toMatchObject({ newResultsCount: 1, lastCheckedAt: NOW });
  });

  it("does not count a listing older than the watermark", async () => {
    store.searches = [search()];
    store.listings = [listing({ createdAt: T("2026-10-01T09:00:00Z") })];
    const out = await runSavedSearchMatch(NOW);
    expect(out.results).toEqual([]);
    expect(store.searches[0].newResultsCount).toBe(0);
    expect(store.searches[0].lastCheckedAt).toEqual(NOW); // still moves the watermark
  });

  it("does not count a listing that doesn't match the criteria", async () => {
    store.searches = [search()];
    store.listings = [listing({ city: "Eket" }), listing({ id: "l2", listingType: "SALE" })];
    expect((await runSavedSearchMatch(NOW)).results).toEqual([]);
  });

  it("does not count the searcher's own listing", async () => {
    store.searches = [search()];
    store.listings = [listing({ landlordId: "renter" })];
    expect((await runSavedSearchMatch(NOW)).results).toEqual([]);
  });

  it("ignores paused and deleted listings", async () => {
    store.searches = [search()];
    store.listings = [listing({ status: "PAUSED" }), listing({ id: "l2", deletedAt: T("2026-10-01T11:30:00Z") })];
    expect((await runSavedSearchMatch(NOW)).results).toEqual([]);
  });

  it("uses the search's own createdAt the first time, so existing listings are not reported", async () => {
    store.searches = [search({ lastCheckedAt: null, createdAt: T("2026-10-01T11:30:00Z") })];
    store.listings = [listing({ createdAt: T("2026-10-01T11:00:00Z") }), listing({ id: "l2", createdAt: T("2026-10-01T11:45:00Z") })];
    expect((await runSavedSearchMatch(NOW)).results[0].newListingIds).toEqual(["l2"]);
  });

  it("is idempotent: a second run right after counts nothing", async () => {
    store.searches = [search()];
    store.listings = [listing()];
    await runSavedSearchMatch(NOW);
    const again = await runSavedSearchMatch(NOW);
    expect(again.results).toEqual([]);
    expect(store.searches[0].newResultsCount).toBe(1);
  });

  it("two overlapping runs count a listing once", async () => {
    store.searches = [search()];
    store.listings = [listing()];
    const [a, b] = await Promise.all([runSavedSearchMatch(NOW), runSavedSearchMatch(NOW)]);
    expect(a.results.length + b.results.length).toBe(1);
    expect(store.searches[0].newResultsCount).toBe(1);
  });

  it("skips broken criteria, logs it, and keeps going", async () => {
    store.searches = [search({ id: "bad", criteria: { v: 99 }, lastCheckedAt: T("2026-09-30T00:00:00Z") }), search({ id: "good" })];
    store.listings = [listing()];
    const out = await runSavedSearchMatch(NOW);
    expect(out.scanned).toBe(2);
    expect(out.results.map((r) => r.searchId)).toEqual(["good"]);
    expect(console.error).toHaveBeenCalled();
    expect(store.searches.find((s) => s.id === "bad")!.newResultsCount).toBe(0);
  });

  it("skips inactive searches and those whose owner is deactivated", async () => {
    store.searches = [search({ id: "off", isActive: false }), search({ id: "gone", ownerDeactivated: true })];
    store.listings = [listing()];
    expect(await runSavedSearchMatch(NOW)).toEqual({ scanned: 0, matched: 0, results: [] });
  });

  it("checks the oldest-checked search first, never-checked before all", async () => {
    store.searches = [
      search({ id: "a", lastCheckedAt: T("2026-10-01T09:00:00Z") }),
      search({ id: "never", lastCheckedAt: null, createdAt: T("2026-09-20T00:00:00Z") }),
      search({ id: "b", lastCheckedAt: T("2026-10-01T08:00:00Z") }),
    ];
    store.listings = [listing({ createdAt: T("2026-10-01T11:00:00Z") })];
    const out = await runSavedSearchMatch(NOW, { batchSize: 1 });
    expect(out.results.map((r) => r.searchId)).toEqual(["never", "b", "a"]);
  });

  it("stops starting new batches once the time budget is spent", async () => {
    store.searches = [search()];
    store.listings = [listing()];
    expect(await runSavedSearchMatch(NOW, { budgetMs: 0 })).toEqual({ scanned: 0, matched: 0, results: [] });
    expect(store.searches[0].lastCheckedAt).toEqual(T("2026-10-01T10:00:00Z")); // untouched, next run continues
  });

  it("one search failing does not stop the others, and is retried next run", async () => {
    store.searches = [search({ id: "boom", criteria: { ...rentInUyo, q: "pool" }, lastCheckedAt: T("2026-09-30T00:00:00Z") }), search({ id: "ok" })];
    store.listings = [listing()];
    store.queryRaw.mockRejectedValue(new Error("db blip"));
    const out = await runSavedSearchMatch(NOW);
    expect(out.results.map((r) => r.searchId)).toEqual(["ok"]);
    expect(store.searches.find((s) => s.id === "boom")!.lastCheckedAt).toEqual(T("2026-09-30T00:00:00Z"));
  });
});
