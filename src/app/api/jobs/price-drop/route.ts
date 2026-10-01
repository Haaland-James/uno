import { NextResponse } from "next/server";
import { verifyQStash } from "@/lib/jobs/verify";
import { runPriceDrop } from "@/lib/jobs/price-drop";

export const dynamic = "force-dynamic";

// Called by a QStash schedule (hourly). Middleware doesn't cover /api, so the
// signature check is the only gate: unsigned requests get a 401 and nothing runs.
export async function POST(req: Request) {
	const verified = await verifyQStash(req);
	if (!verified.ok) return verified.response;

	const summary = await runPriceDrop(new Date());
	return NextResponse.json(summary);
}
