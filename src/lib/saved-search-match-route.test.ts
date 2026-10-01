import { createHash, createHmac, randomUUID } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock("@/lib/jobs/saved-search-match", () => ({ runSavedSearchMatch: mocks.run }));
import { POST } from "../app/api/jobs/saved-search-match/route";
import { jobs } from "./jobs";

const CURRENT = "current-signing-key-for-tests";
const NEXT = "next-signing-key-for-tests";
const URL_ = "https://staging-uno.example.com/api/jobs/saved-search-match";

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
const request = (signature?: string, body = "{}") =>
  new Request(URL_, { method: "POST", body, headers: signature ? { "upstash-signature": signature } : {} });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", CURRENT);
  vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", NEXT);
  mocks.run.mockResolvedValue({ scanned: 3, matched: 1, results: [{ searchId: "s1", userId: "u1", newListingIds: ["l1"] }] });
});
afterEach(() => vi.unstubAllEnvs());

it("answers 401 to an unsigned request and never reaches the job", async () => {
  const res = await POST(request());
  expect(res.status).toBe(401);
  expect(mocks.run).not.toHaveBeenCalled();
});

it("answers 401 to a bad signature", async () => {
  expect((await POST(request(sign("{}", "some-other-key")))).status).toBe(401);
  expect(mocks.run).not.toHaveBeenCalled();
});

it("fails closed when the signing keys are not configured", async () => {
  vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", "");
  vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
  expect((await POST(request(sign("{}", CURRENT)))).status).toBe(401);
  expect(mocks.run).not.toHaveBeenCalled();
});

it("runs the job once for a signed request and returns its summary", async () => {
  const res = await POST(request(sign("{}", CURRENT)));
  expect(res.status).toBe(200);
  expect(mocks.run).toHaveBeenCalledTimes(1);
  expect(mocks.run.mock.calls[0][0]).toBeInstanceOf(Date);
  expect((await res.json()).data).toEqual({ scanned: 3, matched: 1, results: [{ searchId: "s1", userId: "u1", newListingIds: ["l1"] }] });
});

it("also accepts a signature made with the next signing key (key rotation)", async () => {
  expect((await POST(request(sign("{}", NEXT)))).status).toBe(200);
});

it("is registered for scripts/run-job.ts", () => {
  expect(jobs["saved-search-match"]).toBe(mocks.run);
});
