/**
 * Run a scheduled job directly, with no HTTP and no signature check.
 * Usage (UNO-dev only): ALLOW_SEED=1 npx tsx scripts/run-job.ts <job-name>
 * Jobs are registered in src/lib/jobs/index.ts.
 */
import { assertSeedAllowed } from "../src/lib/seed-guard";

export async function main(args = process.argv.slice(2)) {
  const name = args[0];
  if (args.length !== 1 || !name) {
    throw new Error("Usage: ALLOW_SEED=1 npx tsx scripts/run-job.ts <job-name>");
  }
  // Same shell env the other scripts see; Node doesn't override variables already set.
  try { process.loadEnvFile(".env"); } catch { /* no .env file: rely on the shell */ }

  // Jobs can write, so the seed guard runs before the registry (and the database
  // client its jobs import) is loaded: refuses production, the standby and a missing ALLOW_SEED.
  assertSeedAllowed(`run-job ${name}`);

  const { jobs } = await import("../src/lib/jobs");
  const job = Object.hasOwn(jobs, name) ? jobs[name] : undefined;
  if (!job) {
    throw new Error(`Unknown job "${name}". Registered: ${Object.keys(jobs).join(", ") || "(none yet)"}`);
  }
  const summary = await job(new Date());
  console.log(JSON.stringify(summary, null, 2));
}

if (require.main === module) {
  main().catch((error: unknown) => {
    // Don't dump connection details into logs.
    console.error(error instanceof Error && /^(Usage|Unknown job)/.test(error.message)
      ? error.message : "Job failed; check the database connection and the job's own logs.");
    process.exitCode = 1;
  }).finally(async () => {
    // Close the client the jobs opened so the process can end on its own (no process.exit, which can cut off piped output).
    const { db } = await import("../src/lib/db");
    await db.$disconnect();
  });
}
