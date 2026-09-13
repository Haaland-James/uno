import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Liveness + DB check for the deploy pipeline and uptime monitor.
// Middleware skips /api, so this is reachable without a session.
export const dynamic = "force-dynamic";

export async function GET() {
	try {
		await db.$queryRaw`SELECT 1`;
		return NextResponse.json({ status: "ok" });
	} catch {
		return NextResponse.json({ status: "error", db: "unreachable" }, { status: 503 });
	}
}
