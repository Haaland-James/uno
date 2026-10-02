import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), limit: vi.fn(), findUnique: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: mocks.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/ratelimit", () => ({ listingCreateLimiter: { limit: mocks.limit } }));
vi.mock("@/lib/gate", () => ({ computeGateSignals: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { landlordProfile: { upsert: vi.fn() }, user: { findUnique: vi.fn() }, property: { findUnique: mocks.findUnique } },
}));
import { POST } from "../app/api/properties/route";
import { PATCH } from "../app/api/properties/[id]/route";

const valid = {
  objective: "SELL", propertyKind: "RESIDENTIAL", propertyType: "HOUSE", bedrooms: 3, bathrooms: 2,
  state: "Akwa Ibom", city: "Uyo", area: "Ewet", salePrice: 5_000_000,
  photos: [{ url: "https://images.unsplash.com/example.jpg" }],
};
const post = (body: unknown) => new NextRequest("http://localhost/api/properties", { method: "POST", body: JSON.stringify(body) });
const patch = (body: unknown) => new NextRequest("http://localhost/api/properties/p", { method: "PATCH", body: JSON.stringify(body) });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_ENV", "STAGING"); // open to everyone, so only validation is under test
  mocks.session.mockResolvedValue({ user: { id: "owner", role: "LANDLORD" } });
  mocks.limit.mockResolvedValue({ success: true });
  mocks.findUnique.mockResolvedValue({ id: "p", landlordId: "owner", status: "ACTIVE", deletedAt: null });
});

const refusal = async (res: Response) => {
  const body = await res.json();
  return { status: res.status, code: body.error.code, fieldErrors: body.error.details.fieldErrors as Record<string, string[]> };
};

it("a price over the ₦1 trillion guard comes back as a message about that field", async () => {
  const r = await refusal(await POST(post({ ...valid, salePrice: 1_000_000_000_001 })));
  expect(r).toEqual({ status: 400, code: "validation_error", fieldErrors: { salePrice: ["Maximum price is ₦1,000,000,000,000"] } });
});

it("a fractional plot size, a bad contact email and a future year each get their own sentence", async () => {
  const r = await refusal(
    await POST(post({ ...valid, propertyKind: "LAND", plotSizeSqm: 450.5, contactEmail: "nope", yearBuilt: new Date().getFullYear() + 1 }))
  );
  expect(r.status).toBe(400);
  expect(r.fieldErrors).toEqual({
    plotSizeSqm: ["Plot size must be a whole number"],
    contactEmail: ["Enter a valid contact email"],
    yearBuilt: ["Year built can't be in the future"],
  });
});

it("no listing refusal says only 'Invalid request': every failing field has its own message", async () => {
  const r = await refusal(await POST(post({ objective: 5, state: 1, photos: "nope", salePrice: "lots" })));
  const messages = Object.values(r.fieldErrors).flat();
  expect(messages.length).toBeGreaterThan(0);
  for (const m of messages) expect(m).not.toMatch(/\b(expected|received|invalid)\b|^Required$/i);
});

it("saving an edit over the limit names the field too", async () => {
  const r = await refusal(await PATCH(patch({ rent: 1_000_000_000_001 }), { params: { id: "p" } }));
  expect(r).toEqual({ status: 400, code: "validation_error", fieldErrors: { rent: ["Maximum price is ₦1,000,000,000,000"] } });
});

it("an edit with a fractional plot size and an empty photo list says which", async () => {
  const r = await refusal(await PATCH(patch({ plotSizeSqm: 450.5, photos: [] }), { params: { id: "p" } }));
  expect(r.fieldErrors).toEqual({ plotSizeSqm: ["Plot size must be a whole number"], photos: ["Add at least one photo"] });
});
