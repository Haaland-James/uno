import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
	session: vi.fn(), limit: vi.fn(), findUnique: vi.fn(), createMany: vi.fn(), update: vi.fn(),
}));
vi.mock("next-auth", () => ({ getServerSession: mocks.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/ratelimit", () => ({ propertyViewLimiter: { limit: mocks.limit } }));
vi.mock("@/lib/db", () => ({
	db: {
		property: { findUnique: mocks.findUnique },
		$transaction: async (fn: (tx: unknown) => unknown) =>
			fn({ propertyView: { createMany: mocks.createMany }, property: { update: mocks.update } }),
	},
}));
import { POST } from "../app/api/properties/[id]/view/route";

const CHROME = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const ctx = { params: { id: "p" } };
const req = (ua: string | null = CHROME, ip = "198.51.100.24") =>
	new NextRequest("http://localhost/api/properties/p/view", {
		method: "POST",
		headers: { ...(ua ? { "user-agent": ua } : {}), "x-forwarded-for": ip },
	});

beforeEach(() => {
	vi.resetAllMocks();
	vi.stubEnv("NEXTAUTH_SECRET", "test-secret");
	mocks.session.mockResolvedValue(null);
	mocks.limit.mockResolvedValue({ success: true });
	mocks.findUnique.mockResolvedValue({ landlordId: "owner", status: "ACTIVE", deletedAt: null });
	mocks.createMany.mockResolvedValue({ count: 1 });
});

it("records a first view and increments the counter", async () => {
	expect((await POST(req(), ctx)).status).toBe(204);
	expect(mocks.createMany).toHaveBeenCalledTimes(1);
	const row = mocks.createMany.mock.calls[0][0].data[0];
	expect(row).toMatchObject({ propertyId: "p", userId: null });
	expect(row.viewerKey).toMatch(/^a:[0-9a-f]{64}$/);
	expect(row.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	expect(mocks.createMany.mock.calls[0][0].skipDuplicates).toBe(true);
	expect(mocks.update).toHaveBeenCalledWith({ where: { id: "p" }, data: { views: { increment: 1 } } });
});

it("does not increment on a same-day duplicate", async () => {
	mocks.createMany.mockResolvedValue({ count: 0 });
	expect((await POST(req(), ctx)).status).toBe(204);
	expect(mocks.update).not.toHaveBeenCalled();
});

it("keys signed-in viewers by user id", async () => {
	mocks.session.mockResolvedValue({ user: { id: "renter", role: "TENANT" } });
	await POST(req(), ctx);
	expect(mocks.createMany.mock.calls[0][0].data[0]).toMatchObject({ userId: "renter", viewerKey: "u:renter" });
});

it.each([
	["owner", { user: { id: "owner", role: "LANDLORD" } }],
	["admin", { user: { id: "someone", role: "ADMIN" } }],
])("ignores views by the %s", async (_who, session) => {
	mocks.session.mockResolvedValue(session);
	expect((await POST(req(), ctx)).status).toBe(204);
	expect(mocks.createMany).not.toHaveBeenCalled();
});

it.each([
	[{ landlordId: "owner", status: "PAUSED", deletedAt: null }],
	[{ landlordId: "owner", status: "ACTIVE", deletedAt: new Date() }],
	[null],
])("ignores non-public listings: %j", async (row) => {
	mocks.findUnique.mockResolvedValue(row);
	expect((await POST(req(), ctx)).status).toBe(204);
	expect(mocks.createMany).not.toHaveBeenCalled();
});

it("ignores bots before touching the limiter or DB", async () => {
	expect((await POST(req("Googlebot/2.1"), ctx)).status).toBe(204);
	expect(mocks.limit).not.toHaveBeenCalled();
	expect(mocks.createMany).not.toHaveBeenCalled();
});

it("rate-limits per client IP and listing, and returns 204 with no write when exceeded", async () => {
	mocks.limit.mockResolvedValue({ success: false });
	expect((await POST(req(CHROME, "203.0.113.9"), ctx)).status).toBe(204);
	expect(mocks.limit).toHaveBeenCalledWith("203.0.113.9:p");
	expect(mocks.findUnique).not.toHaveBeenCalled();
	expect(mocks.createMany).not.toHaveBeenCalled();
});

it("keys the limiter per listing, so one IP browsing many listings is not throttled together", async () => {
	await POST(req(CHROME, "203.0.113.9"), { params: { id: "a" } });
	await POST(req(CHROME, "203.0.113.9"), { params: { id: "b" } });
	expect(mocks.limit.mock.calls.map((c) => c[0])).toEqual(["203.0.113.9:a", "203.0.113.9:b"]);
});

it("skips counting when the limiter itself fails", async () => {
	vi.spyOn(console, "error").mockImplementation(() => {});
	mocks.limit.mockRejectedValue(new Error("redis down"));
	expect((await POST(req(), ctx)).status).toBe(204);
	expect(mocks.createMany).not.toHaveBeenCalled();
});

it("still returns 204 when the DB write fails", async () => {
	vi.spyOn(console, "error").mockImplementation(() => {});
	mocks.createMany.mockRejectedValue(new Error("db down"));
	expect((await POST(req(), ctx)).status).toBe(204);
});
