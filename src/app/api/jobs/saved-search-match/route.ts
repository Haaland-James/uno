import { ok } from "@/lib/api";
import { verifyQStash } from "@/lib/jobs/verify";
import { runSavedSearchMatch } from "@/lib/jobs/saved-search-match";

/**
 * POST /api/jobs/saved-search-match — called by the QStash schedule (every 15 min).
 * Middleware doesn't cover /api, so the signature is checked here first; anything
 * unsigned or badly signed gets a 401 and the job never runs. The logic lives in
 * src/lib/jobs/saved-search-match.ts; this route only verifies, runs it and
 * returns its summary.
 */
export async function POST(req: Request) {
  const verified = await verifyQStash(req);
  if (!verified.ok) return verified.response;

  const summary = await runSavedSearchMatch(new Date());
  return ok(summary);
}
