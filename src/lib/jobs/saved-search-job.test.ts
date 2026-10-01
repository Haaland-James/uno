import { beforeEach, describe, expect, it, vi } from "vitest";

// The whole scheduled job: runSavedSearchMatch (badge + watermark) then delivery (email),
// against a small in-memory stand-in for the two tables.

type Row = {
	id: string; userId: string; name: string; criteria: unknown; isActive: boolean;
	notifyEmail: boolean; notifyInstant: boolean; lastCheckedAt: Date | null; createdAt: Date; newResultsCount: number;
	user: { id: string; name: string; email: string; notifyNewProperties: boolean; deactivatedAt: Date | null };
};
type Listing = { id: string; landlordId: string; city: string; listingType: string; status: string; deletedAt: Date | null; createdAt: Date };

const store = vi.hoisted(() => ({ searches: [] as any[], listings: [] as any[], sendEmail: vi.fn() }));

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
		$queryRaw: vi.fn(),
		property: {
			findMany: async ({ where, take }: any) => {
				const rows = (store.listings as Listing[]).filter((l) => matches(l, where)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
				// The matcher asks for ids; delivery asks for the fields it shows.
				return rows.slice(0, take ?? rows.length).map((l) => ({
					id: l.id, title: `Flat ${l.id}`, area: "Ewet", city: l.city, rent: 1_500_000, rentPeriod: "YEAR", listingType: l.listingType,
					photos: [{ url: `https://images.unsplash.com/${l.id}.jpg` }],
				}));
			},
		},
		savedSearch: {
			findMany: async ({ where, take }: any) => {
				const all = store.searches as Row[];
				if (where.id?.in) return all.filter((s) => where.id.in.includes(s.id)); // delivery
				const skip: string[] = where.id?.notIn ?? []; // matcher
				return all
					.filter((s) => s.isActive === where.isActive && !s.user.deactivatedAt && !skip.includes(s.id))
					.sort((a, b) => (a.lastCheckedAt?.getTime() ?? -Infinity) - (b.lastCheckedAt?.getTime() ?? -Infinity) || a.id.localeCompare(b.id))
					.slice(0, take);
			},
			updateMany: async ({ where, data }: any) => {
				const row = (store.searches as Row[]).find((s) => s.id === where.id && sameDate(s.lastCheckedAt, where.lastCheckedAt));
				if (!row) return { count: 0 };
				row.lastCheckedAt = data.lastCheckedAt;
				if (data.newResultsCount?.increment) row.newResultsCount += data.newResultsCount.increment;
				return { count: 1 };
			},
		},
	},
}));
vi.mock("@/lib/email/render", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/email/render")>()),
	sendEmail: store.sendEmail,
}));
import { runSavedSearchMatchAndDeliver } from "./saved-search-delivery";

const T = (iso: string) => new Date(iso);
const NOW = T("2026-10-01T12:00:00Z");
const row = (over: Partial<Row> = {}, userOver: Partial<Row["user"]> = {}): Row => ({
	id: "s1", userId: "renter", name: "Rent in Uyo", criteria: { v: 1, category: "rent", citySlug: "uyo" }, isActive: true,
	notifyEmail: true, notifyInstant: true, lastCheckedAt: T("2026-10-01T10:00:00Z"), createdAt: T("2026-09-20T00:00:00Z"), newResultsCount: 0,
	user: { id: "renter", name: "Ada", email: "ada@example.com", notifyNewProperties: true, deactivatedAt: null, ...userOver },
	...over,
});
const listing = (over: Partial<Listing> = {}): Listing => ({
	id: "l1", landlordId: "someone-else", city: "Uyo", listingType: "RENT", status: "ACTIVE", deletedAt: null, createdAt: T("2026-10-01T11:00:00Z"), ...over,
});

beforeEach(() => {
	store.searches = [];
	store.listings = [listing()];
	store.sendEmail.mockReset().mockResolvedValue({});
	vi.restoreAllMocks();
	vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("saved-search job: match, then deliver", () => {
	it("raises the badge and sends one email for a new match", async () => {
		store.searches = [row()];
		const summary = await runSavedSearchMatchAndDeliver(NOW);
		expect(summary).toEqual({ scanned: 1, matched: 1, delivery: { users: 1, emailed: 1, failed: 0, skipped: 0 } });
		expect(store.searches[0].newResultsCount).toBe(1);
		expect(store.sendEmail).toHaveBeenCalledTimes(1);
	});

	it.each([
		["email off", { notifyEmail: false }, {}],
		["instant off", { notifyInstant: false }, {}],
		["user's new-property notifications off", {}, { notifyNewProperties: false }],
	])("%s: no email, but the badge count still rises", async (_label, searchOver, userOver) => {
		store.searches = [row(searchOver, userOver)];
		await runSavedSearchMatchAndDeliver(NOW);
		expect(store.searches[0].newResultsCount).toBe(1);
		expect(store.sendEmail).not.toHaveBeenCalled();
	});

	it("a second run right after neither re-counts nor re-sends", async () => {
		store.searches = [row()];
		await runSavedSearchMatchAndDeliver(NOW);
		const again = await runSavedSearchMatchAndDeliver(new Date(NOW.getTime() + 1000));
		expect(again).toMatchObject({ matched: 0, delivery: { users: 0, emailed: 0 } });
		expect(store.searches[0].newResultsCount).toBe(1);
		expect(store.sendEmail).toHaveBeenCalledTimes(1);
	});

	it("a failed send doesn't fail the job or roll back the watermark and badge, and isn't retried", async () => {
		store.searches = [row()];
		store.sendEmail.mockRejectedValue(new Error("resend down"));
		const summary = await runSavedSearchMatchAndDeliver(NOW);
		expect(summary.delivery).toMatchObject({ emailed: 0, failed: 1 });
		expect(store.searches[0].lastCheckedAt).toEqual(NOW);
		expect(store.searches[0].newResultsCount).toBe(1);

		store.sendEmail.mockResolvedValue({});
		await runSavedSearchMatchAndDeliver(new Date(NOW.getTime() + 1000));
		expect(store.sendEmail).toHaveBeenCalledTimes(1); // only the failed attempt: a missed email, never a duplicate
	});

	it("emails one person once for two searches that match", async () => {
		store.searches = [row(), row({ id: "s2", name: "Anything in Uyo" })];
		await runSavedSearchMatchAndDeliver(NOW);
		expect(store.sendEmail).toHaveBeenCalledTimes(1);
		expect(store.searches.map((s: Row) => s.newResultsCount)).toEqual([1, 1]);
	});
});
