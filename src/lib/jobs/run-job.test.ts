import { afterEach, beforeEach, expect, it, vi } from "vitest";

const demo = vi.hoisted(() => vi.fn());
vi.mock("@/lib/jobs", () => ({ jobs: { demo } }));
vi.mock("@/lib/db", () => ({ db: { $disconnect: vi.fn() } }));
import { main } from "../../../scripts/run-job";

const DEV_URL = "postgresql://postgres.hraeogwysgoohlomzdjl:pw@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

beforeEach(() => {
	demo.mockReset().mockResolvedValue({ scanned: 3 });
	vi.stubEnv("DATABASE_URL", DEV_URL);
	vi.stubEnv("DIRECT_URL", DEV_URL);
	vi.stubEnv("ALLOW_SEED", "1");
	vi.spyOn(console, "log").mockImplementation(() => {});
	vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

it("runs the named job directly with the current time and prints its summary", async () => {
	await main(["demo"]);
	expect(demo).toHaveBeenCalledTimes(1);
	expect(demo.mock.calls[0][0]).toBeInstanceOf(Date);
	expect(vi.mocked(console.log).mock.calls.flat().join("\n")).toContain('"scanned": 3');
});

it("needs exactly one job name", async () => {
	await expect(main([])).rejects.toThrow("Usage");
	await expect(main(["demo", "extra"])).rejects.toThrow("Usage");
	expect(demo).not.toHaveBeenCalled();
});

it("rejects an unknown job name, and names like Object prototype keys", async () => {
	await expect(main(["nope"])).rejects.toThrow('Unknown job "nope"');
	await expect(main(["toString"])).rejects.toThrow("Unknown job");
	expect(demo).not.toHaveBeenCalled();
});

it.each([
	["without ALLOW_SEED", { ALLOW_SEED: "" }],
	["against the production database", { DIRECT_URL: "postgresql://u:p@db:5432/uno_prod" }],
	["against the Vercel standby", { DATABASE_URL: "postgresql://postgres.xufgwbywgbgejsejnect:pw@aws-1-eu-west-2.pooler.supabase.com:6543/postgres" }],
])("the seed guard stops it %s before the job runs", async (_label, env) => {
	for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
	vi.spyOn(process, "exit").mockImplementation((() => { throw new Error("exit"); }) as never);
	await expect(main(["demo"])).rejects.toThrow("exit");
	expect(demo).not.toHaveBeenCalled();
});
