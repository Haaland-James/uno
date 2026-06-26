import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
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
