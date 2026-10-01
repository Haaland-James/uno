import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), similar: vi.fn(), favourites: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: async () => null }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({ db: { property: { findUnique: mocks.findUnique }, favourite: { findMany: mocks.favourites } } }));
vi.mock("@/lib/similar-properties", () => ({ findSimilarProperties: mocks.similar }));
import { GET } from "../app/api/properties/[id]/similar/route";

const call = (query = "") => GET(new NextRequest(`http://localhost/api/properties/p1/similar${query}`), { params: { id: "p1" } });
const seed = { area: "Ewet", city: "Uyo", propertyType: "FLAT", rent: 1_000_000, listingType: "RENT" };

beforeEach(() => {
	vi.resetAllMocks();
	mocks.findUnique.mockResolvedValue(seed);
	mocks.similar.mockResolvedValue([]);
});

describe("GET /api/properties/[id]/similar", () => {
	it("404s for an unknown listing", async () => {
		mocks.findUnique.mockResolvedValue(null);
		expect((await call()).status).toBe(404);
		expect(mocks.similar).not.toHaveBeenCalled();
	});
	it("asks for up to 6 by default", async () => {
		await call();
		expect(mocks.similar).toHaveBeenCalledWith(seed, "p1", 6);
	});
	it.each([["?limit=abc", 6], ["?limit=0", 6], ["?limit=-3", 6], ["?limit=4", 4], ["?limit=50", 12]])("limit %s → %i", async (q, expected) => {
		await call(q);
		expect(mocks.similar.mock.calls[0][2]).toBe(expected);
	});
	it("answers with an empty list when there is nothing similar", async () => {
		const res = await call();
		expect(res.status).toBe(200);
		expect((await res.json()).data.items).toEqual([]);
	});
});
