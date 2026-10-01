import { ok } from "@/lib/api";
import { verifyQStash } from "@/lib/jobs/verify";
import { runSavedSearchMatchAndDeliver } from "@/lib/jobs/saved-search-delivery";

/**
 * POST /api/jobs/saved-search-match — called by the QStash schedule (every 15 min).
 * Middleware doesn't cover /api, so the signature is checked here first; anything
 * unsigned or badly signed gets a 401 and the job never runs. The logic lives in
 * src/lib/jobs/saved-search-match.ts (count + badge) and saved-search-delivery.ts
 * (email); this route only verifies, runs the pair and returns the summary.
 */
export async function POST(req: Request) {
  const verified = await verifyQStash(req);
  if (!verified.ok) return verified.response;

  const summary = await runSavedSearchMatchAndDeliver(new Date());
  return ok(summary);
}
