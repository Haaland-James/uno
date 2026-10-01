import { ok } from "@/lib/api";
import { verifyQStash } from "@/lib/jobs/verify";
import { pruneViews } from "@/lib/jobs/prune-views";

/**
 * POST /api/jobs/prune-views — called by the QStash schedule (daily, 03:00 UTC).
 * Middleware doesn't cover /api, so the signature is checked here first; anything
 * unsigned or badly signed gets a 401 and nothing is deleted. The logic lives in
 * src/lib/jobs/prune-views.ts; this route only verifies, runs it and returns its summary.
 */
export async function POST(req: Request) {
  const verified = await verifyQStash(req);
  if (!verified.ok) return verified.response;

  return ok(await pruneViews(new Date()));
}
