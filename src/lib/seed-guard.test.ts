import { describe, expect, it } from "vitest";
import { checkSeedGuard, describeTarget } from "./seed-guard";
import { envBannerLabel } from "./app-env";

const REF = "xufgwbywgbgejsejnect";
const DEV = "postgresql://postgres.hraeogwysgoohlomzdjl:secret@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";
const STAGING = "postgresql://uno:secret@vps.example.com:5432/uno_staging";
const PROD_DB = "postgresql://uno:secret@vps.example.com:5432/uno_prod";
// The standby (Vercel's Supabase project) in each form its ref can appear in:
const STANDBY_POOLER = `postgresql://postgres.${REF}:secret@aws-1-eu-west-2.pooler.supabase.com:5432/postgres`; // username
const STANDBY_DIRECT = `postgresql://postgres:secret@db.${REF}.supabase.co:5432/postgres`; // host
const STANDBY_OPTIONS = `postgresql://postgres:secret@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?options=project%3D${REF}`; // options

describe("checkSeedGuard", () => {
	it.each([["UNO-dev", DEV], ["staging", STAGING]])("allows %s with ALLOW_SEED=1", (_n, url) => {
		expect(checkSeedGuard({ DATABASE_URL: url, DIRECT_URL: url, ALLOW_SEED: "1" }).ok).toBe(true);
	});

	it.each([[undefined], ["0"], ["true"], [""]])("refuses a safe database without ALLOW_SEED=1 (got %j)", (flag) => {
		const r = checkSeedGuard({ DATABASE_URL: DEV, ALLOW_SEED: flag });
		expect(r.ok).toBe(false);
		expect(r.ok === false && r.reason).toMatch(/ALLOW_SEED=1/);
	});

	it.each([
		["uno_prod database", PROD_DB],
		["standby pooler form (ref in username)", STANDBY_POOLER],
		["standby direct form (ref in host)", STANDBY_DIRECT],
		["standby ref in connection options", STANDBY_OPTIONS],
	])("refuses the %s even with ALLOW_SEED=1", (_n, url) => {
		const r = checkSeedGuard({ DATABASE_URL: url, DIRECT_URL: url, ALLOW_SEED: "1" });
		expect(r.ok).toBe(false);
		expect(r.ok === false && r.reason).toMatch(/production/);
	});

	it("refuses when only one of the two URLs points at production", () => {
		expect(checkSeedGuard({ DATABASE_URL: DEV, DIRECT_URL: PROD_DB, ALLOW_SEED: "1" }).ok).toBe(false);
		expect(checkSeedGuard({ DATABASE_URL: STANDBY_POOLER, DIRECT_URL: DEV, ALLOW_SEED: "1" }).ok).toBe(false);
	});

	it("refuses when no database URL is set", () => {
		expect(checkSeedGuard({ ALLOW_SEED: "1" }).ok).toBe(false);
	});

	it("reports host and database, never the password", () => {
		const r = checkSeedGuard({ DATABASE_URL: PROD_DB, ALLOW_SEED: "1" });
		expect(r.targets).toEqual([{ host: "vps.example.com", database: "uno_prod" }]);
		expect(JSON.stringify(r)).not.toContain("secret");
		expect(describeTarget("not a url")).toEqual({ host: "(unparseable)", database: "(unparseable)" });
	});

	it.each([STANDBY_POOLER, STANDBY_DIRECT, STANDBY_OPTIONS])("never puts the standby ref or credentials in the result: %#", (url) => {
		const r = checkSeedGuard({ DATABASE_URL: url, DIRECT_URL: url, ALLOW_SEED: "1" });
		const printed = JSON.stringify(r);
		expect(printed).not.toContain(REF);
		expect(printed).not.toContain("secret");
	});
});

describe("envBannerLabel", () => {
	it.each([["STAGING", "Staging — demo data"], ["staging", "Staging — demo data"], ["DEV", "Development — demo data"], [undefined, "Development — demo data"]])(
		"shows a label for %s", (env, label) => expect(envBannerLabel(env)).toBe(label));
	it("labels an unknown environment as not live", () => expect(envBannerLabel("preview")).toBe("PREVIEW — not the live site"));
	it.each([["PROD"], ["prod"], ["PRODUCTION"], ["STANDBY"], ["standby"]])("shows nothing on %s", (env) => expect(envBannerLabel(env)).toBeNull());
});
