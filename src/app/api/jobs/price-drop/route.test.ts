import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ run: vi.fn(), verify: vi.fn() }));
vi.mock("@/lib/jobs/price-drop", () => ({ runPriceDrop: mocks.run }));
vi.mock("@/lib/jobs/verify", async (orig) => {
	const real = await orig<typeof import("@/lib/jobs/verify")>();
	mocks.verify.mockImplementation(real.verifyQStash);
	return { ...real, verifyQStash: mocks.verify };
});
import { POST } from "./route";

const req = (headers: Record<string, string> = {}) =>
	new Request("http://localhost/api/jobs/price-drop", { method: "POST", body: "{}", headers });

beforeEach(() => {
	mocks.run.mockReset().mockResolvedValue({ scanned: 4, emailed: 1 });
	vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", "current");
	vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", "next");
});
afterEach(() => vi.unstubAllEnvs());

it("rejects an unsigned request with 401 and never runs the job", async () => {
	expect((await POST(req())).status).toBe(401);
	expect(mocks.run).not.toHaveBeenCalled();
});

it("rejects a forged signature with 401 and never runs the job", async () => {
	expect((await POST(req({ "Upstash-Signature": "a.b.c" }))).status).toBe(401);
	expect(mocks.run).not.toHaveBeenCalled();
});

it("runs the job and returns its summary once the request is verified", async () => {
	mocks.verify.mockResolvedValueOnce({ ok: true, body: "{}" });
	const res = await POST(req({ "Upstash-Signature": "x" }));
	expect(res.status).toBe(200);
	expect(await res.json()).toEqual({ scanned: 4, emailed: 1 });
	expect(mocks.run).toHaveBeenCalledTimes(1);
	expect(mocks.run.mock.calls[0][0]).toBeInstanceOf(Date);
});
