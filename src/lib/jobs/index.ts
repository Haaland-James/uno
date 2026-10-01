/**
 * Registry of scheduled jobs: name → function. `scripts/run-job.ts <name>` runs
 * one directly (no HTTP, no signature). Each job also has its own endpoint at
 * src/app/api/jobs/<name>/route.ts, which calls the same function after
 * verifyQStash().
 *
 * Every job takes `now` and returns a plain summary object, and must be safe to
 * run twice (QStash retries). Packets add their job here, one line each.
 */
export type JobFn = (now: Date) => Promise<unknown>;

export const jobs: Record<string, JobFn> = {};
