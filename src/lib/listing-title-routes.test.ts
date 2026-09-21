import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), draftUpdate: vi.fn(), gate: vi.fn(),
  transaction: vi.fn(),
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
});
const property = { id: "p", landlordId: "owner", status: "ACTIVE", deletedAt: null, propertyKind: "RESIDENTIAL", propertyType: "FLAT", listingType: "RENT", bedrooms: 2, city: "Uyo", area: "Ewet" };
const req = (body: unknown) => new NextRequest("http://localhost/api/properties/p", { method: "PATCH", body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.findUnique.mockResolvedValue(property);
  mocks.update.mockResolvedValue({ id: "p" });
  mocks.transaction.mockImplementation(async (fn) => fn({
    $queryRaw: vi.fn().mockResolvedValue([{ id: "p" }]),
    property: { findUniqueOrThrow: mocks.findUnique, update: mocks.update },
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
