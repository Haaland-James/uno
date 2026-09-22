import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "@/app/api/contacts/[id]/route";
import { POST } from "@/app/api/contacts/route";
import { DELETE, GET } from "@/app/api/properties/[id]/route";

const mocks = vi.hoisted(() => ({
  session: vi.fn(), refresh: vi.fn(),
  contact: { findUnique: vi.fn(), update: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
  property: { findUnique: vi.fn(), update: vi.fn() },
  user: { findUnique: vi.fn() },
}));
vi.mock("next-auth", () => ({ getServerSession: mocks.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/response-metrics", async (importOriginal) => ({
  ...await importOriginal<typeof import("./response-metrics")>(),
  refreshResponseMetrics: mocks.refresh,
}));
vi.mock("@/lib/ratelimit", () => ({ contactRequestLimiter: { limit: async () => ({ success: true }) } }));
vi.mock("@/lib/email", () => ({ sendBestEffort: vi.fn(), sendContactLeadEmail: vi.fn() }));
vi.mock("@/lib/db", () => {
  const db = { contactRequest: mocks.contact, property: mocks.property, user: mocks.user };
  return { db: { ...db, $transaction: async (fn: (tx: typeof db) => unknown) => fn(db) } };
});
const request = (body: object) => new NextRequest("http://localhost/api/contacts", { method: "POST", body: JSON.stringify(body) });
const ctx = { params: { id: "contact" } };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "owner", role: "LANDLORD" } });
  mocks.contact.findUnique.mockResolvedValue({ property: { landlordId: "owner" }, readAt: null, respondedAt: new Date(0) });
  mocks.contact.update.mockResolvedValue({ id: "contact" });
  mocks.property.update.mockResolvedValue({ id: "property" });
});
describe("response metric write triggers", () => {
  it.each([0, 2, 3])("reads a real cross-property sample of %s for detail visibility", async (sampleSize) => {
    mocks.session.mockResolvedValue(null);
    mocks.contact.count.mockResolvedValue(sampleSize);
    mocks.contact.findMany.mockResolvedValue(Array.from({ length: sampleSize }, () => ({
      createdAt: new Date(0), respondedAt: new Date(120 * 60_000),
    })));
    mocks.property.findUnique.mockResolvedValue({
      id: "property", landlordId: "owner", status: "ACTIVE", deletedAt: null,
      photos: [], amenities: [], createdAt: new Date(), updatedAt: new Date(), contactCount: 999,
      landlord: { id: "owner", name: "Owner", landlordProfile: { responseRate: 75, avgResponseTime: 180 } },
    });
    const response = await GET(request({}), ctx);
    expect(response.status).toBe(200);
    expect(mocks.contact.findMany).toHaveBeenCalledWith({
      where: { property: { landlordId: "owner", deletedAt: null } },
      select: { createdAt: true, respondedAt: true },
    });
    const body = await response.json();
    expect(body.data.listedBy.responseRate).toBe(sampleSize >= 3 ? 100 : null);
    expect(body.data.listedBy.avgResponseTime).toBe(sampleSize >= 3 ? 120 : null);
    expect(mocks.contact.count).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it.each([null, { responseRate: 0, avgResponseTime: null }, { responseRate: 95, avgResponseTime: 180 }])(
    "derives historical responses before any mutation, ignoring profile %j", async (landlordProfile) => {
      mocks.session.mockResolvedValue(null);
      mocks.property.findUnique.mockResolvedValue({
        id: "property", landlordId: "owner", status: "ACTIVE", deletedAt: null,
        photos: [], amenities: [], createdAt: new Date(), updatedAt: new Date(),
        landlord: { id: "owner", name: "Owner", landlordProfile },
      });
      const createdAt = new Date("2020-01-01T00:00:00Z");
      mocks.contact.findMany.mockResolvedValue([
        { createdAt, respondedAt: new Date("2020-01-01T02:00:00Z") },
        { createdAt, respondedAt: null },
        { createdAt, respondedAt: new Date("2020-01-01T06:00:00Z") },
        { createdAt, respondedAt: null },
      ]);
      const body = await (await GET(request({}), ctx)).json();
      expect(body.data.listedBy).toMatchObject({ responseRate: 50, avgResponseTime: 240 });
      expect(mocks.refresh).not.toHaveBeenCalled();
      expect(mocks.contact.update).not.toHaveBeenCalled();
      expect(mocks.contact.create).not.toHaveBeenCalled();
      expect(mocks.contact.findMany).toHaveBeenCalledTimes(1);
    }
  );
  it("uses one fresh source snapshot when enquiries change after the profile was loaded", async () => {
    mocks.session.mockResolvedValue(null);
    mocks.property.findUnique.mockResolvedValue({
      id: "property", landlordId: "owner", status: "ACTIVE", deletedAt: null,
      photos: [], amenities: [], createdAt: new Date(), updatedAt: new Date(),
      landlord: { id: "owner", name: "Owner", landlordProfile: { responseRate: 100, avgResponseTime: 10 } },
    });
    // A response reset/deletion has committed since the property/profile query.
    mocks.contact.findMany.mockResolvedValue(Array.from({ length: 3 }, () => ({
      createdAt: new Date(0), respondedAt: null,
    })));
    const body = await (await GET(request({}), ctx)).json();
    expect(body.data.listedBy).toMatchObject({ responseRate: 0, avgResponseTime: null });
    expect(mocks.contact.count).not.toHaveBeenCalled();
    expect(mocks.contact.findMany).toHaveBeenCalledTimes(1);
  });
  it("skips source metrics for agent listings", async () => {
    mocks.session.mockResolvedValue(null);
    mocks.property.findUnique.mockResolvedValue({
      id: "property", landlordId: "owner", status: "ACTIVE", deletedAt: null, listedByAgent: true,
      photos: [], amenities: [], createdAt: new Date(), updatedAt: new Date(),
      landlord: { id: "owner", name: "Owner", landlordProfile: { responseRate: 100, avgResponseTime: 10 } },
    });
    const body = await (await GET(request({}), ctx)).json();
    expect(body.data.listedBy).toMatchObject({ responseRate: null, avgResponseTime: null });
    expect(mocks.contact.findMany).not.toHaveBeenCalled();
  });
  it.each(["RESPONDED", "UNREAD"])("refreshes after %s without changing existing timestamp semantics", async (status) => {
    const response = await PATCH(request({ status }), ctx);
    expect(response.status).toBe(200);
    expect(mocks.refresh).toHaveBeenCalledWith("owner");
    expect(mocks.contact.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.refresh.mock.invocationCallOrder[0]);
    const data = mocks.contact.update.mock.calls[0][0].data;
    if (status === "RESPONDED") expect(data.respondedAt).toBeInstanceOf(Date);
    else { expect(data.readAt).toBeNull(); expect(data).not.toHaveProperty("respondedAt"); }
  });
  it("does not recompute after an unauthorized status change", async () => {
    mocks.session.mockResolvedValue({ user: { id: "stranger" } });
    expect((await PATCH(request({ status: "RESPONDED" }), ctx)).status).toBe(403);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it.each([false, true])("refreshes the denominator only for a newly created enquiry (deduped=%s)", async (deduped) => {
    mocks.session.mockResolvedValue({ user: { id: "renter" } });
    mocks.user.findUnique.mockResolvedValue({ id: "renter", name: "Renter", email: "renter@example.com" });
    mocks.property.findUnique.mockResolvedValue({ id: "property", landlordId: "owner", status: "ACTIVE", deletedAt: null, landlord: { email: "owner@example.com", landlordProfile: null } });
    mocks.contact.findFirst.mockResolvedValue(deduped ? { id: "existing" } : null);
    mocks.contact.create.mockResolvedValue({ id: "new" });
    const response = await POST(request({ propertyId: "property", contactMethod: "EMAIL" }));
    expect(response.status).toBe(deduped ? 200 : 201);
    if (deduped) expect(mocks.refresh).not.toHaveBeenCalled();
    else expect(mocks.refresh).toHaveBeenCalledWith("owner");
  });
  it("refreshes after property deletion removes that property's enquiries from the sample", async () => {
    mocks.property.findUnique.mockResolvedValue({ landlordId: "owner", deletedAt: null });
    expect((await DELETE(request({}), ctx)).status).toBe(200);
    expect(mocks.refresh).toHaveBeenCalledWith("owner");
    expect(mocks.property.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.refresh.mock.invocationCallOrder[0]);
  });
});
