import { createHash, createHmac, randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type View = { id: string; createdAt: Date };
const store = vi.hoisted(() => ({ views: [] as { id: string; createdAt: Date }[], counter: vi.fn() }));

// In-memory PropertyView table. `property.update` is wired to a spy so the test can prove the running counter is never touched.
vi.mock("@/lib/db", () => ({
  db: {
    propertyView: {
      findMany: async ({ where, take }: { where: { createdAt: { lt: Date } }; take: number }) =>
        store.views.filter((v) => v.createdAt < where.createdAt.lt).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).slice(0, take).map((v) => ({ id: v.id })),
      deleteMany: async ({ where }: { where: { id: { in: string[] } } }) => {
        const before = store.views.length;
        store.views = store.views.filter((v) => !where.id.in.includes(v.id));
        return { count: before - store.views.length };
      },
    },
    property: { update: store.counter, updateMany: store.counter },
  },
}));
import { monthsBefore, pruneViews } from "./jobs/prune-views";
import { POST } from "../app/api/jobs/prune-views/route";
import { jobs } from "./jobs";

const NOW = new Date("2026-10-15T03:00:00Z");
const monthsAgo = (m: number, extraDays = 0) => {
  const d = monthsBefore(NOW, m);
  d.setUTCDate(d.getUTCDate() - extraDays);
  return d;
};
const view = (id: string, createdAt: Date): View => ({ id, createdAt });
const ids = () => store.views.map((v) => v.id).sort();

beforeEach(() => {
  store.views = [];
  store.counter.mockReset();
});

describe("pruneViews", () => {
  it("deletes a 14-month-old row and keeps a 12-month-old one", async () => {
    store.views = [view("old", monthsAgo(14)), view("recent", monthsAgo(12))];
    const out = await pruneViews(NOW);
    expect(ids()).toEqual(["recent"]);
    expect(out).toMatchObject({ deleted: 1, complete: true });
  });

  it("keeps a row just inside 13 months and deletes one just outside", async () => {
    store.views = [view("inside", monthsAgo(13, -1)), view("outside", monthsAgo(13, 1))];
    await pruneViews(NOW);
    expect(ids()).toEqual(["inside"]);
  });

  it("never touches the running Property.views counter", async () => {
    store.views = [view("old", monthsAgo(20))];
    await pruneViews(NOW);
    expect(store.counter).not.toHaveBeenCalled();
  });

  it("works through a backlog in bounded batches, oldest first", async () => {
    store.views = Array.from({ length: 25 }, (_, i) => view(`v${i}`, monthsAgo(14 + i)));
    const out = await pruneViews(NOW, { batchSize: 10 });
    expect(out).toMatchObject({ deleted: 25, batches: 3, complete: true });
    expect(store.views).toEqual([]);
  });

  it("is safe to run twice: the second run finds nothing", async () => {
    store.views = [view("old", monthsAgo(14)), view("recent", monthsAgo(1))];
    await pruneViews(NOW);
    expect(await pruneViews(NOW)).toMatchObject({ deleted: 0, batches: 0, complete: true });
    expect(ids()).toEqual(["recent"]);
  });

  it("stops at the time budget and reports it is not complete, so the next run continues", async () => {
    store.views = [view("old", monthsAgo(14))];
    expect(await pruneViews(NOW, { budgetMs: 0 })).toMatchObject({ deleted: 0, complete: false });
    expect(ids()).toEqual(["old"]);
  });

  it("reports the cutoff it used", async () => {
    expect((await pruneViews(NOW)).cutoff).toBe("2025-09-15T03:00:00.000Z");
  });
});

describe("monthsBefore", () => {
  it.each([
    ["2026-10-15T03:00:00Z", 13, "2025-09-15T03:00:00.000Z"],
    ["2026-03-31T00:00:00Z", 1, "2026-02-28T00:00:00.000Z"], // clamps, doesn't spill into March
    ["2024-03-31T00:00:00Z", 1, "2024-02-29T00:00:00.000Z"], // leap year
    ["2026-01-31T00:00:00Z", 13, "2024-12-31T00:00:00.000Z"],
  ])("%s minus %d months", (from, months, expected) => {
    expect(monthsBefore(new Date(from), months).toISOString()).toBe(expected);
  });
});

describe("POST /api/jobs/prune-views", () => {
  const CURRENT = "current-signing-key-for-tests";
  const NEXT = "next-signing-key-for-tests";
  const URL_ = "https://staging-uno.example.com/api/jobs/prune-views";
  const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
  // What QStash sends: an HS256 JWT over the request, carrying a hash of the exact body.
  function sign(body: string, key: string) {
    const now = Math.floor(Date.now() / 1000);
    const unsigned = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
      iss: "Upstash", sub: URL_, iat: now, nbf: now - 5, exp: now + 300, jti: randomUUID(),
      body: createHash("sha256").update(body).digest("base64url"),
    })}`;
    return `${unsigned}.${createHmac("sha256", key).update(unsigned).digest("base64url")}`;
  }
  const request = (signature?: string) =>
    new Request(URL_, { method: "POST", body: "{}", headers: signature ? { "upstash-signature": signature } : {} });

  beforeEach(() => {
    vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", CURRENT);
    vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", NEXT);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("answers 401 to an unsigned request and deletes nothing", async () => {
    store.views = [view("old", monthsAgo(20))];
    expect((await POST(request())).status).toBe(401);
    expect(ids()).toEqual(["old"]);
  });

  it("answers 401 to a bad signature and deletes nothing", async () => {
    store.views = [view("old", monthsAgo(20))];
    expect((await POST(request(sign("{}", "some-other-key")))).status).toBe(401);
    expect(ids()).toEqual(["old"]);
  });

  it("fails closed when the signing keys are not configured", async () => {
    vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", "");
    vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    store.views = [view("old", monthsAgo(20))];
    expect((await POST(request(sign("{}", CURRENT)))).status).toBe(401);
    expect(ids()).toEqual(["old"]);
  });

  it("prunes for a signed request and returns the summary", async () => {
    store.views = [view("old", monthsAgo(20)), view("recent", monthsAgo(2))];
    const res = await POST(request(sign("{}", CURRENT)));
    expect(res.status).toBe(200);
    expect((await res.json()).data).toMatchObject({ deleted: 1, complete: true });
    expect(ids()).toEqual(["recent"]);
  });

  it("is registered for scripts/run-job.ts", () => {
    expect(jobs["prune-views"]).toBe(pruneViews);
  });
});
