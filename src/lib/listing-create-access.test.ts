import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { canCreateListing, isListingCreationOpen } from "./listing-access";

const mocks = vi.hoisted(() => ({
	session: vi.fn(), limit: vi.fn(), gate: vi.fn(), create: vi.fn(), upsert: vi.fn(), userFind: vi.fn(),
}));
vi.mock("next-auth", () => ({ getServerSession: mocks.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/ratelimit", () => ({ listingCreateLimiter: { limit: mocks.limit } }));
vi.mock("@/lib/gate", () => ({ computeGateSignals: mocks.gate }));
vi.mock("@/lib/db", () => ({
	db: {
		landlordProfile: { upsert: mocks.upsert },
		user: { findUnique: mocks.userFind },
		property: { create: mocks.create },
	},
}));
import { POST } from "../app/api/properties/route";

type TestUser = { id: string; role: string; agentStatus: string; agentEmployment: string | null };
const RENTER: TestUser = { id: "renter", role: "TENANT", agentStatus: "NONE", agentEmployment: null };
const AGENT: TestUser = { id: "agent", role: "LANDLORD", agentStatus: "VERIFIED", agentEmployment: "IN_HOUSE" };
const ADMIN: TestUser = { id: "admin", role: "ADMIN", agentStatus: "NONE", agentEmployment: null };

const body = {
	propertyKind: "RESIDENTIAL", propertyType: "FLAT", objective: "RENT", bedrooms: 2, bathrooms: 2,
	state: "Akwa Ibom", city: "Uyo", area: "Ewet", rent: 500000,
	photos: [{ url: "https://images.unsplash.com/example.jpg" }],
	offPlatformOwnerName: "Mrs Okon", offPlatformOwnerPhone: "+2348012345678",
};
const req = () => new NextRequest("http://localhost/api/properties", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
	vi.resetAllMocks();
	mocks.limit.mockResolvedValue({ success: true });
	mocks.gate.mockResolvedValue({ signals: {} });
	mocks.create.mockResolvedValue({ id: "p", status: "ACTIVE" });
	mocks.upsert.mockResolvedValue({});
});

// Route behaviour on each deployment value. `undefined` = NEXT_PUBLIC_APP_ENV unset.
async function as(user: TestUser, env: string | undefined) {
	vi.stubEnv("NEXT_PUBLIC_APP_ENV", env ?? "");
	if (env === undefined) delete process.env.NEXT_PUBLIC_APP_ENV;
	mocks.session.mockResolvedValue({ user: user });
	// The route reads the submitter's agent flags from the DB to set listedByAgent.
	mocks.userFind.mockResolvedValue({ agentStatus: user.agentStatus, agentEmployment: user.agentEmployment });
	return POST(req());
}

describe.each([["PROD", "PROD"], ["STANDBY", "STANDBY"], ["unset", undefined]])("on %s", (_label, env) => {
	it("refuses a renter with 403 and a plain message, before touching the limiter or DB", async () => {
		const res = await as(RENTER, env);
		expect(res.status).toBe(403);
		expect((await res.json()).error.message).toMatch(/limited to .* agents/);
		expect(mocks.limit).not.toHaveBeenCalled();
		expect(mocks.create).not.toHaveBeenCalled();
	});
	it("lets a verified in-house agent create (201)", async () => {
		expect((await as(AGENT, env)).status).toBe(201);
		expect(mocks.create.mock.calls[0][0].data.listedByAgent).toBe(true);
	});
	it("lets an admin create (201)", async () => {
		expect((await as(ADMIN, env)).status).toBe(201);
	});
});

describe.each(["STAGING", "DEV"])("on %s", (env) => {
	it("lets a renter create (201)", async () => {
		expect((await as(RENTER, env)).status).toBe(201);
		expect(mocks.create.mock.calls[0][0].data.listedByAgent).toBe(false);
	});
});

it("still returns 401 to a signed-out caller on any environment", async () => {
	vi.stubEnv("NEXT_PUBLIC_APP_ENV", "DEV");
	mocks.session.mockResolvedValue(null);
	expect((await POST(req())).status).toBe(401);
});

describe("canCreateListing / isListingCreationOpen", () => {
	it.each(["STAGING", "DEV", "dev", " staging "])("treats %j as open", (env) => expect(isListingCreationOpen(env)).toBe(true));
	it.each([undefined, "", "PROD", "PRODUCTION", "STANDBY", "DEVELOPMENT", "STAGIN", "preview"])("fails closed on %j", (env) =>
		expect(isListingCreationOpen(env)).toBe(false));

	it("requires a verified IN-HOUSE agent, not just any agent status", () => {
		expect(canCreateListing({ agentStatus: "VERIFIED", agentEmployment: "EXTERNAL" }, "PROD")).toBe(false);
		expect(canCreateListing({ agentStatus: "PENDING", agentEmployment: "IN_HOUSE" }, "PROD")).toBe(false);
		expect(canCreateListing({ agentStatus: "VERIFIED", agentEmployment: "IN_HOUSE" }, "PROD")).toBe(true);
		expect(canCreateListing({ role: "ADMIN" }, "PROD")).toBe(true);
		expect(canCreateListing({ role: "LANDLORD" }, "PROD")).toBe(false);
	});
});
