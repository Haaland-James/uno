/**
 * Guard for anything that bulk-writes or wipes data (prisma/seed.ts, the
 * backfill scripts with --apply). Two locks, both required:
 *   1. ALLOW_SEED=1 is set, so a stray `npm run seed` cannot run by accident.
 *   2. The target is not production: database name `uno_prod`, or a connection
 *      string that mentions the Vercel standby's project ref anywhere.
 * The result carries host + database only, never credentials, so it is safe to log.
 */

const PROD_DATABASE = "uno_prod";
const STANDBY_MARKER = "xufgwbywgbgejsejnect";

export type SeedTarget = { host: string; database: string };

export type SeedGuardResult =
	| { ok: true; targets: SeedTarget[] }
	| { ok: false; reason: string; targets: SeedTarget[] };

// Printed output never carries the standby ref: the direct form puts it in the host.
const redact = (s: string) => s.split(STANDBY_MARKER).join("<standby-ref>");

export function describeTarget(url: string): SeedTarget {
	try {
		const u = new URL(url);
		return {
			host: redact(u.hostname || "(unknown)"),
			database: redact(decodeURIComponent(u.pathname.replace(/^\//, "")) || "(unknown)"),
		};
	} catch {
		return { host: "(unparseable)", database: "(unparseable)" };
	}
}

// Match against the raw string, not parsed parts: Supabase's pooler puts the
// project ref in the username (`postgres.<ref>`), the direct form in the host
// (`db.<ref>.supabase.co`), and options such as `?options=project%3D<ref>` can
// carry it too. Only the boolean leaves this function, never the string.
function isProduction(url: string): boolean {
	return describeTarget(url).database.toLowerCase() === PROD_DATABASE || url.toLowerCase().includes(STANDBY_MARKER);
}

/**
 * Checks every URL Prisma might use (DATABASE_URL, DIRECT_URL) so a safe pooled
 * URL cannot mask a production direct URL. No URL at all is a refusal.
 */
export function checkSeedGuard(env: Record<string, string | undefined>): SeedGuardResult {
	const urls = [env.DATABASE_URL, env.DIRECT_URL].filter((u): u is string => !!u);
	const targets = urls.map(describeTarget);
	if (urls.length === 0) {
		return { ok: false, reason: "No DATABASE_URL or DIRECT_URL is set.", targets };
	}
	const prodIndex = urls.findIndex(isProduction);
	if (prodIndex !== -1) {
		const t = targets[prodIndex];
		return { ok: false, reason: `Refusing: ${t.host} / ${t.database} is production or the production standby.`, targets };
	}
	if (env.ALLOW_SEED !== "1") {
		return { ok: false, reason: "Refusing: set ALLOW_SEED=1 to confirm you mean to write to this database.", targets };
	}
	return { ok: true, targets };
}

/** Call before creating a PrismaClient or writing anything. Exits the process on refusal. */
export function assertSeedAllowed(label: string, env: Record<string, string | undefined> = process.env): void {
	const result = checkSeedGuard(env);
	const where = result.targets.map((t) => `${t.host} / ${t.database}`).join(", ") || "(none)";
	if (!result.ok) {
		console.error(`✖ ${label} blocked. Target: ${where}\n  ${result.reason}`);
		process.exit(1);
	}
	console.log(`▶ ${label} target: ${where}`);
}
