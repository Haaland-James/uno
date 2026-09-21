import { beforeEach, describe, expect, it, vi } from "vitest";
import { recomputeResponseMetrics, refreshResponseMetrics } from "./response-metrics";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), upsert: vi.fn(), lock: vi.fn(), transaction: vi.fn() }));
const tx = { contactRequest: { findMany: mocks.findMany }, landlordProfile: { upsert: mocks.upsert }, $executeRaw: mocks.lock };
vi.mock("@/lib/db", () => ({ db: { contactRequest: { findMany: mocks.findMany }, landlordProfile: { upsert: mocks.upsert }, $transaction: mocks.transaction } }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation(async (fn) => fn(tx));
});
describe("response metrics persistence", () => {
  it("serializes concurrent refreshes before reading their source snapshots", async () => {
    const deferred = () => {
      let resolve!: () => void;
      const promise = new Promise<void>((done) => { resolve = done; });
      return { promise, resolve };
    };
    const firstWrite = deferred();
    const releaseFirst = deferred();
    const secondAttempt = deferred();
    let tail = Promise.resolve();
    let lockAttempts = 0;
    mocks.transaction.mockImplementation(async (fn, options) => {
      expect(options).toEqual({ isolationLevel: "ReadCommitted" });
      let unlock: (() => void) | undefined;
      try {
        return await fn({ ...tx, $executeRaw: async (sql: TemplateStringsArray, owner: string) => {
          expect(sql.join("?")).toContain("pg_advisory_xact_lock");
          expect(sql.join("?")).not.toContain(owner);
          expect(owner).toBe("owner");
          const previous = tail;
          const next = deferred();
          tail = next.promise;
          if (++lockAttempts === 2) secondAttempt.resolve();
          await previous;
          unlock = next.resolve;
        } });
      } finally { unlock?.(); }
    });
    const answered = { createdAt: new Date(0), respondedAt: new Date(60_000) };
    let rows = [answered, { createdAt: new Date(0), respondedAt: null as Date | null }];
    let reads = 0;
    mocks.findMany.mockImplementation(async () => {
      if (++reads === 2) secondAttempt.resolve();
      return [...rows];
    });
    let storedRate: number | undefined;
    let writes = 0;
    mocks.upsert.mockImplementation(async ({ update }) => {
      if (++writes === 1) { firstWrite.resolve(); await releaseFirst.promise; }
      storedRate = update.responseRate;
    });
    const first = recomputeResponseMetrics("owner");
    await firstWrite.promise;
    rows = [answered, answered]; // A second source mutation commits during the first refresh.
    const second = recomputeResponseMetrics("owner");
    await secondAttempt.promise;
    const readsWhileFirstHeld = reads;
    releaseFirst.resolve();
    await Promise.all([first, second]);
    expect(readsWhileFirstHeld).toBe(1);
    expect(storedRate).toBe(100);
    expect(lockAttempts).toBe(2);
  });
  it("uses actual enquiries across non-deleted properties and upserts even a missing profile", async () => {
    mocks.findMany.mockResolvedValue([
      { createdAt: new Date(0), respondedAt: new Date(60_000) },
      { createdAt: new Date(0), respondedAt: null },
    ]);
    await recomputeResponseMetrics("owner");
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { property: { landlordId: "owner", deletedAt: null } },
      select: { createdAt: true, respondedAt: true },
    });
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { userId: "owner" },
      create: { userId: "owner", responseRate: 50, avgResponseTime: 1 },
      update: { responseRate: 50, avgResponseTime: 1 },
    });
  });
  it("logs a failed recompute without rejecting the successful source operation", async () => {
    const error = new Error("database unavailable");
    mocks.findMany.mockRejectedValue(error);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(refreshResponseMetrics("owner")).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith("[metrics] Response metrics refresh failed", error);
    expect(mocks.upsert).not.toHaveBeenCalled();
    log.mockRestore();
  });
  it("resets stale stored metrics when deletion leaves no eligible enquiries", async () => {
    mocks.findMany.mockResolvedValue([]);
    await recomputeResponseMetrics("owner");
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { userId: "owner" },
      create: { userId: "owner", responseRate: 0, avgResponseTime: null },
      update: { responseRate: 0, avgResponseTime: null },
    });
  });
  it("lowers the rate after a new unanswered enquiry, without altering response time", async () => {
    const response = { createdAt: new Date(0), respondedAt: new Date(180 * 60_000) };
    mocks.findMany.mockResolvedValueOnce([response]);
    await recomputeResponseMetrics("owner");
    expect(mocks.upsert.mock.calls[0][0].update).toEqual({ responseRate: 100, avgResponseTime: 180 });
    mocks.findMany.mockResolvedValueOnce([response, { createdAt: new Date(0), respondedAt: null }]);
    await recomputeResponseMetrics("owner");
    expect(mocks.upsert.mock.calls[1][0].update).toEqual({ responseRate: 50, avgResponseTime: 180 });
  });
});
