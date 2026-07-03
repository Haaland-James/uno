import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/api";
import { authIpLimiter } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  // Public by design (login flow decides OTP vs password UI), but throttled —
  // unthrottled it doubles as an account-enumeration oracle.
  const rl = await authIpLimiter.limit(getClientIp(req));
  if (!rl.success) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many requests. Try again in a minute." } },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const email = body?.email?.toLowerCase?.().trim();
  if (!email) {
    return NextResponse.json({ hasPassword: false });
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { passwordHash: true },
  });

  return NextResponse.json({ hasPassword: !!user?.passwordHash });
}
