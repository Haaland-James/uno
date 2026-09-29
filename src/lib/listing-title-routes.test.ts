import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), draftUpdate: vi.fn(), gate: vi.fn(),
  transaction: vi.fn(), priceCreate: vi.fn(),
}));
vi.mock("next-auth", () => ({ getServerSession: async () => ({ user: { id: "owner", role: "LANDLORD" } }) }));
vi.mock("@/lib/ratelimit", () => ({ listingCreateLimiter: { limit: async () => ({ success: true }) } }));
vi.mock("@/lib/gate", () => ({ computeGateSignals: mocks.gate }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => {
  return { db: { landlordProfile: { upsert: vi.fn() }, user: { findUnique: vi.fn() }, property: { findUnique: mocks.findUnique, create: mocks.create }, propertyDraft: { create: mocks.create, findUnique: mocks.findUnique, update: mocks.draftUpdate }, $transaction: mocks.transaction } };
});
import { POST as publish } from "../app/api/properties/route";
import { PATCH } from "../app/api/properties/[id]/route";
import { POST as saveDraft } from "../app/api/me/drafts/route";
import { PATCH as updateDraft } from "../app/api/me/drafts/[id]/route";
it.each([
  ["RESIDENTIAL", "FLAT", "RENT", 3, "3 Bedroom Flat for Rent in Ewet, Uyo"],
  ["COMMERCIAL", "OFFICE", "LEASE", null, "Office Space for Lease in Ewet, Uyo"],
  ["LAND", "RESIDENTIAL_PLOT", "SELL", null, "Residential Plot for Sale in Ewet, Uyo"],
] as const)("publishes %s without a client title, using the same title for the gate", async (propertyKind, propertyType, objective, bedrooms, title) => {
  mocks.gate.mockResolvedValue({ signals: {} });
  mocks.create.mockResolvedValue({ id: "p", status: "ACTIVE" });
  const response = await publish(req({ propertyKind, propertyType, objective, bedrooms, bathrooms: null,
    state: "Akwa Ibom", city: "Uyo", area: "Ewet", rent: 200000, salePrice: 1000000,
    photos: [{ url: "https://images.unsplash.com/example.jpg" }],
  }));
  expect(response.status).toBe(201);
  expect(mocks.create.mock.calls[0][0].data.title).toBe(title);
  expect(mocks.gate.mock.calls[0][0].title).toBe(title);
  expect(mocks.create.mock.calls[0][0].data.priceHistory.create).toMatchObject({
    rent: objective === "SELL" ? 1000000 : 200000,
    listingType: mocks.create.mock.calls[0][0].data.listingType,
    changedById: "owner",
  });
});
const property = { id: "p", landlordId: "owner", status: "ACTIVE", deletedAt: null, propertyKind: "RESIDENTIAL", propertyType: "FLAT", listingType: "RENT", bedrooms: 2, city: "Uyo", area: "Ewet", rent: 150000, rentPeriod: "YEAR" };
const req = (body: unknown) => new NextRequest("http://localhost/api/properties/p", { method: "PATCH", body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.findUnique.mockResolvedValue(property);
  mocks.update.mockResolvedValue({ id: "p" });
  mocks.transaction.mockImplementation(async (fn) => fn({
    $queryRaw: vi.fn().mockResolvedValue([{ id: "p" }]),
    property: { findUniqueOrThrow: mocks.findUnique, update: mocks.update },
    priceHistory: { create: mocks.priceCreate },
  }));
});
it.each([
  [{ bedrooms: 3 }, { area: "Shelter Afrique" }],
  [{ area: "Shelter Afrique" }, { bedrooms: 3 }],
])("keeps the title consistent after concurrent different-field edits: %j then %j", async (first, second) => {
  let row = { ...property, title: "2 Bedroom Flat for Rent in Ewet, Uyo" };
  let reads = 0;
  let releaseReads!: () => void;
  const bothRead = new Promise<void>((resolve) => { releaseReads = resolve; });
  // Force both authorization reads to see the old row before either writes.
  mocks.findUnique.mockImplementation(async () => {
    const snapshot = { ...row };
    if (++reads === 2) releaseReads();
    await bothRead;
    return snapshot;
  });
  let lockTail = Promise.resolve();
  mocks.transaction.mockImplementation(async (fn) => {
    let unlock: (() => void) | undefined;
    const lock = async () => {
      if (unlock) return;
      const previous = lockTail;
      lockTail = new Promise<void>((resolve) => { unlock = resolve; });
      await previous;
    };
    try {
      return await fn({
        $queryRaw: async (sql: TemplateStringsArray, ...values: unknown[]) => {
          expect(sql.join("?")).toMatch(/SELECT "id" FROM "Property" WHERE "id" = \? FOR UPDATE/);
          expect(values).toEqual(["p"]);
          await lock();
          return [{ id: row.id }];
        },
        property: {
          findUniqueOrThrow: async () => ({ ...row }),
          update: async ({ data }: { data: Partial<typeof row> }) => {
            // PostgreSQL UPDATE also takes a row lock, even without SELECT FOR UPDATE.
            await lock();
            row = { ...row, ...data };
            return { id: row.id, status: row.status };
          },
        },
      });
    } finally {
      unlock?.();
    }
  });
  const responses = await Promise.all([
    PATCH(req(first), { params: { id: "p" } }),
    PATCH(req(second), { params: { id: "p" } }),
  ]);
  expect(responses.map((response) => response.status)).toEqual([200, 200]);
  expect(row).toMatchObject({ bedrooms: 3, area: "Shelter Afrique" });
  expect(row.title).toBe("3 Bedroom Flat for Rent in Shelter Afrique, Uyo");
});
it.each([
  [{ listingType: "SALE" }, "2 Bedroom Flat for Sale in Ewet, Uyo"],
  [{ bedrooms: 0 }, "Studio Flat for Rent in Ewet, Uyo"],
  [{ area: "Uyo" }, "2 Bedroom Flat for Rent in Uyo"],
  [{ propertyType: "SHOP" }, "Shop for Rent in Ewet, Uyo"],
])("regenerates from patched facts merged over the existing row: %j", async (body, title) => {
  expect((await PATCH(req({ ...body, title: "Forged title" }), { params: { id: "p" } })).status).toBe(200);
  expect(mocks.update.mock.calls[0][0].data.title).toBe(title);
});
it("does not rewrite titles for price-only edits or forged titles", async () => {
  await PATCH(req({ rent: 200000, title: "Forged title" }), { params: { id: "p" } });
  expect(mocks.update.mock.calls[0][0].data).not.toHaveProperty("title");
});
it.each([
  [{ rent: 120000 }, { rent: 120000, rentPeriod: "YEAR", listingType: "RENT" }],
  [{ rentPeriod: "MONTH" }, { rent: 150000, rentPeriod: "MONTH", listingType: "RENT" }],
  [{ listingType: "SALE" }, { rent: 150000, rentPeriod: "YEAR", listingType: "SALE" }],
])("records one price point when an edit changes the price: %j", async (body, point) => {
  expect((await PATCH(req(body), { params: { id: "p" } })).status).toBe(200);
  expect(mocks.priceCreate).toHaveBeenCalledTimes(1);
  expect(mocks.priceCreate.mock.calls[0][0].data).toEqual({ propertyId: "p", ...point, changedById: "owner" });
});
it("accepts a ₦345M price edit on a SALE listing and records it", async () => {
  mocks.findUnique.mockResolvedValue({ ...property, listingType: "SALE", rent: 200_000_000 });
  expect((await PATCH(req({ rent: 345_000_000 }), { params: { id: "p" } })).status).toBe(200);
  expect(mocks.update.mock.calls[0][0].data.rent).toBe(345_000_000);
  expect(mocks.priceCreate.mock.calls[0][0].data).toMatchObject({ rent: 345_000_000, listingType: "SALE" });
});
it("lets a ₦5B SALE listing be created, then edited to ₦6.5B with exactly one price-history row", async () => {
  mocks.gate.mockResolvedValue({ signals: {} });
  mocks.create.mockResolvedValue({ id: "p", status: "ACTIVE" });
  const created = await publish(new NextRequest("http://localhost/api/properties", { method: "POST", body: JSON.stringify({
    propertyKind: "RESIDENTIAL", propertyType: "HOUSE", objective: "SELL", bedrooms: 6, bathrooms: 6,
    state: "Lagos", city: "Lagos", area: "Ikoyi", salePrice: 5_000_000_000,
    photos: [{ url: "https://images.unsplash.com/example.jpg" }],
  }) }));
  expect(created.status).toBe(201);
  expect(mocks.create.mock.calls[0][0].data.rent).toBe(5_000_000_000);

  mocks.findUnique.mockResolvedValue({ ...property, listingType: "SALE", rent: 5_000_000_000 });
  expect((await PATCH(req({ rent: 6_500_000_000 }), { params: { id: "p" } })).status).toBe(200);
  expect(mocks.update.mock.calls[0][0].data.rent).toBe(6_500_000_000);
  expect(mocks.priceCreate).toHaveBeenCalledTimes(1);
  expect(mocks.priceCreate.mock.calls[0][0].data).toMatchObject({ rent: 6_500_000_000, listingType: "SALE" });
});
it.each([
  [{ rent: 150000, rentPeriod: "YEAR" }],
  [{ bedrooms: 3 }],
  [{ description: "Freshly painted" }],
])("records no price point when the price is unchanged: %j", async (body) => {
  expect((await PATCH(req(body), { params: { id: "p" } })).status).toBe(200);
  expect(mocks.priceCreate).not.toHaveBeenCalled();
});
it("derives draft hints on both create and update", async () => {
  const body = { data: { propertyType: "WAREHOUSE", objective: "SELL", city: "Uyo", title: "Spam" } };
  mocks.create.mockResolvedValue({ id: "d" });
  await saveDraft(req(body));
  expect(mocks.create.mock.calls[0][0].data.titleHint).toBe("Warehouse for Sale in Uyo");
  mocks.findUnique.mockResolvedValue({ id: "d", userId: "owner" });
  mocks.draftUpdate.mockResolvedValue({ id: "d" });
  await updateDraft(req(body), { params: { id: "d" } });
  expect(mocks.draftUpdate.mock.calls[0][0].data.titleHint).toBe("Warehouse for Sale in Uyo");
});
