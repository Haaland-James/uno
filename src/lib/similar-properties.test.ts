import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = {
	id: string; area: string; city: string; propertyType: string; listingType: string;
	rent: number; status: string; deletedAt: Date | null; createdAt: Date;
};

const store = vi.hoisted(() => ({ rows: [] as unknown[], calls: [] as unknown[] }));

// In-memory stand-in for the Property table: evaluates just the where-clauses the helper builds.
const matches = (r: Row, w: Record<string, any>): boolean => {
	if ("deletedAt" in w && r.deletedAt !== w.deletedAt) return false;
	if ("status" in w && r.status !== w.status) return false;
	if ("listingType" in w && r.listingType !== w.listingType) return false;
	if ("area" in w && r.area !== w.area) return false;
	if ("city" in w && r.city !== w.city) return false;
	if ("propertyType" in w && r.propertyType !== w.propertyType) return false;
	if (w.rent?.gte !== undefined && r.rent < w.rent.gte) return false;
	if (w.rent?.lte !== undefined && r.rent > w.rent.lte) return false;
	if (w.id?.not !== undefined && r.id === w.id.not) return false;
	if (w.id?.notIn && w.id.notIn.includes(r.id)) return false;
	if (w.OR && !w.OR.some((o: Record<string, any>) => matches(r, o))) return false;
	return true;
};

vi.mock("@/lib/db", () => ({
	db: {
		property: {
			findMany: async (args: { where: Record<string, any>; take: number }) => {
				store.calls.push(args);
				return (store.rows as Row[])
					.filter((r) => matches(r, args.where))
					.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
					.slice(0, args.take);
			},
		},
	},
}));
import { findSimilarProperties, MIN_SIMILAR } from "./similar-properties";

let n = 0;
const row = (over: Partial<Row> = {}): Row => ({
	id: `p${++n}`, area: "Ewet", city: "Uyo", propertyType: "FLAT", listingType: "RENT", rent: 1_000_000,
	status: "ACTIVE", deletedAt: null, createdAt: new Date(2026, 9, 1, 0, n), ...over,
});
const seed = { area: "Ewet", city: "Uyo", propertyType: "FLAT", rent: 1_000_000, listingType: "RENT" } as never;
const ids = (items: { id: string }[]) => items.map((i) => i.id);

beforeEach(() => { n = 0; store.rows = []; store.calls = []; });

describe("findSimilarProperties", () => {
	it("returns the strong matches without widening when there are already enough", async () => {
		store.rows = [row({ id: "self" }), ...Array.from({ length: 8 }, () => row())];
		const items = await findSimilarProperties(seed, "self", 6);
		expect(items).toHaveLength(6); // capped at the limit
		expect(store.calls).toHaveLength(1);
		expect(ids(items)).not.toContain("self");
	});

	it("tops up from the same city and type when the area has fewer than 3", async () => {
		store.rows = [
			row({ id: "self" }),
			row({ id: "area1" }),
			row({ id: "city-type1", area: "Ikot Ekpene Rd", rent: 9_000_000 }), // outside the price band: only the widened step finds it
			row({ id: "city-type2", area: "Aka Rd", rent: 9_500_000 }),
			row({ id: "city-flat-other-type", area: "Aka Rd", propertyType: "DUPLEX" }),
		];
		const items = await findSimilarProperties(seed, "self", 6);
		expect(ids(items).slice(0, 1)).toEqual(["area1"]);
		expect(ids(items)).toEqual(expect.arrayContaining(["area1", "city-type1", "city-type2"]));
		expect(items.length).toBeGreaterThanOrEqual(MIN_SIMILAR);
	});

	it("widens in order: same area, then city + type, then city, then the listing type anywhere", async () => {
		store.rows = [
			row({ id: "self" }),
			row({ id: "area-1" }),                                                       // strong match
			row({ id: "city-type", area: "Aka Rd", rent: 9_000_000 }),                   // step: same city + type
			row({ id: "city-only", area: "Aka Rd", propertyType: "DUPLEX", rent: 9_000_000, createdAt: new Date(2026, 9, 2) }), // step: same city
			row({ id: "elsewhere", city: "Eket", area: "Central", propertyType: "DUPLEX", createdAt: new Date(2026, 9, 3) }),   // step: anywhere
		];
		const items = await findSimilarProperties(seed, "self", 6);
		// Stops widening as soon as it has 3, so the "anywhere" step is never reached.
		expect(ids(items)).toEqual(["area-1", "city-type", "city-only"]);
	});

	it("reaches the same listing type anywhere when nothing nearby exists", async () => {
		store.rows = [
			row({ id: "self" }),
			row({ id: "far1", city: "Eket", area: "A", propertyType: "DUPLEX" }),
			row({ id: "far2", city: "Oron", area: "B", propertyType: "DUPLEX" }),
			row({ id: "far3", city: "Ikot Abasi", area: "C", propertyType: "DUPLEX" }),
		];
		const items = await findSimilarProperties(seed, "self", 6);
		expect(ids(items).sort()).toEqual(["far1", "far2", "far3"]);
	});

	it("never includes the listing itself, paused or deleted listings, or other listing types", async () => {
		store.rows = [
			row({ id: "self" }),
			row({ id: "paused", status: "PAUSED" }),
			row({ id: "pending", status: "PENDING" }),
			row({ id: "deleted", deletedAt: new Date() }),
			row({ id: "sale", listingType: "SALE" }),
			row({ id: "ok1" }), row({ id: "ok2" }), row({ id: "ok3" }),
		];
		const items = await findSimilarProperties(seed, "self", 6);
		expect(ids(items).sort()).toEqual(["ok1", "ok2", "ok3"]);
	});

	it("never repeats a listing across the steps", async () => {
		store.rows = [row({ id: "self" }), row({ id: "a" }), row({ id: "b", rent: 9_000_000 }), row({ id: "c", propertyType: "DUPLEX" }), row({ id: "d", city: "Eket" })];
		const items = await findSimilarProperties(seed, "self", 6);
		expect(new Set(ids(items)).size).toBe(items.length);
	});

	it("returns whatever there is when the whole site has fewer than 3 other listings", async () => {
		store.rows = [row({ id: "self" }), row({ id: "only", city: "Eket", area: "X" })];
		expect(ids(await findSimilarProperties(seed, "self", 6))).toEqual(["only"]);
		store.rows = [row({ id: "self" })];
		expect(await findSimilarProperties(seed, "self", 6)).toEqual([]);
	});

	it("never returns more than the limit, even when widening", async () => {
		store.rows = [row({ id: "self" }), ...Array.from({ length: 10 }, (_, i) => row({ city: "Eket", area: `A${i}`, propertyType: "DUPLEX" }))];
		expect(await findSimilarProperties(seed, "self", 4)).toHaveLength(4);
	});

	it("takes the newest first within a widening step", async () => {
		store.rows = [
			row({ id: "self" }),
			row({ id: "old", city: "Eket", area: "A", propertyType: "DUPLEX", createdAt: new Date(2026, 0, 1) }),
			row({ id: "new", city: "Eket", area: "B", propertyType: "DUPLEX", createdAt: new Date(2026, 5, 1) }),
			row({ id: "mid", city: "Eket", area: "C", propertyType: "DUPLEX", createdAt: new Date(2026, 3, 1) }),
		];
		expect(ids(await findSimilarProperties(seed, "self", 6))).toEqual(["new", "mid", "old"]);
	});
});
