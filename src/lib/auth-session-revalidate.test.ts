import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JWT } from "next-auth/jwt";
import type { NextAuthOptions, Session } from "next-auth";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/otp", () => ({ verifyOtp: vi.fn() }));

import { authOptions, SESSION_RECHECK_MS } from "./auth";

type Callbacks = NonNullable<NextAuthOptions["callbacks"]>;
const jwt = (token: JWT, extra: Record<string, unknown> = {}) =>
  authOptions.callbacks!.jwt!({ token, ...extra } as unknown as Parameters<NonNullable<Callbacks["jwt"]>>[0]);

const adminToken = (checkedAt?: number): JWT => ({
  id: "u1", role: "ADMIN", agentStatus: "NONE", agentEmployment: null, checkedAt,
});
const stale = () => Date.now() - SESSION_RECHECK_MS - 1000;
const dbUser = (over = {}) => ({
  role: "ADMIN", agentStatus: "NONE", agentEmployment: null, deactivatedAt: null, ...over,
});

beforeEach(() => mocks.findUnique.mockReset());
afterEach(() => vi.restoreAllMocks());

describe("jwt callback re-checks the database", () => {
  it("makes no database call for a fresh token", async () => {
    const token = await jwt(adminToken(Date.now() - 60_000));
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(token.role).toBe("ADMIN");
  });

  it("drops the role of a demoted admin once the token is stale", async () => {
    mocks.findUnique.mockResolvedValue(dbUser({ role: "RENTER" }));
    const before = Date.now();
    const token = await jwt(adminToken(stale()));
    expect(mocks.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.findUnique.mock.calls[0][0].where).toEqual({ id: "u1" });
    expect(token.role).toBe("RENTER");
    expect(token.checkedAt).toBeGreaterThanOrEqual(before);
  });

  it("refreshes agent fields, e.g. a revoked agent", async () => {
    mocks.findUnique.mockResolvedValue(dbUser({ role: "LANDLORD", agentStatus: "REJECTED", agentEmployment: null }));
    const token = await jwt({ ...adminToken(stale()), role: "LANDLORD", agentStatus: "VERIFIED", agentEmployment: "IN_HOUSE" });
    expect(token.agentStatus).toBe("REJECTED");
    expect(token.agentEmployment).toBeNull();
  });

  it("re-checks a token that has no checkedAt (issued before this change)", async () => {
    mocks.findUnique.mockResolvedValue(dbUser());
    await jwt(adminToken(undefined));
    expect(mocks.findUnique).toHaveBeenCalledTimes(1);
  });

  it("flags a deactivated user so middleware signs them out", async () => {
    const when = new Date("2026-09-29T10:00:00Z");
    mocks.findUnique.mockResolvedValue(dbUser({ deactivatedAt: when }));
    const token = await jwt(adminToken(stale()));
    expect(token.deactivatedAt).toBe(when.toISOString());
  });

  it("revokes the token when the user no longer exists", async () => {
    mocks.findUnique.mockResolvedValue(null);
    const token = await jwt(adminToken(stale()));
    expect(token.revoked).toBe(true);
  });

  it("does not look up again once revoked", async () => {
    const token = await jwt({ ...adminToken(stale()), revoked: true });
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(token.revoked).toBe(true);
  });

  it("keeps the token and retries next time if the database errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.findUnique.mockRejectedValueOnce(new Error("db down"));
    const old = stale();
    const token = await jwt(adminToken(old));
    expect(token.role).toBe("ADMIN");
    expect(token.revoked).toBeUndefined();
    expect(token.checkedAt).toBe(old);
  });

  it("stamps checkedAt on sign-in without a lookup", async () => {
    const token = await jwt({} as JWT, { user: { id: "u1", role: "RENTER" }, trigger: "signIn" });
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(token.checkedAt).toBeGreaterThan(Date.now() - 5000);
  });
});

describe("session callback", () => {
  const session = { user: { name: "A" }, expires: "x" } as unknown as Session;
  const run = (token: JWT) =>
    authOptions.callbacks!.session!({ session, token } as unknown as Parameters<NonNullable<Callbacks["session"]>>[0]);

  it("returns an empty session (→ getServerSession null) for revoked or deactivated tokens", async () => {
    expect(await run({ ...adminToken(1), revoked: true })).toEqual({});
    expect(await run({ ...adminToken(1), deactivatedAt: "2026-09-29T00:00:00.000Z" })).toEqual({});
  });

  it("passes through a normal token", async () => {
    const out = (await run(adminToken(1))) as Session;
    expect(out.user.role).toBe("ADMIN");
  });
});
