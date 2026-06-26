import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { notificationPrefsSchema } from "@/lib/validators/user";

const PREFS_SELECT = {
  notifyNewProperties: true,
  notifyPriceDrops: true,
  notifyWeeklyDigest: true,
} as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return err("unauthorized", "Sign in first", 401);
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: PREFS_SELECT,
  });

  if (!user) return err("not_found", "User not found", 404);
  return ok(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return err("unauthorized", "Sign in first", 401);
  }

  const body = await req.json().catch(() => null);
  if (!body) return err("bad_request", "Invalid JSON body", 400);

  const parsed = notificationPrefsSchema.safeParse(body);
  if (!parsed.success) return zodErr(parsed.error);

  const data: Record<string, boolean> = {};
  if (parsed.data.notifyNewProperties !== undefined)
    data.notifyNewProperties = parsed.data.notifyNewProperties;
  if (parsed.data.notifyPriceDrops !== undefined)
    data.notifyPriceDrops = parsed.data.notifyPriceDrops;
  if (parsed.data.notifyWeeklyDigest !== undefined)
    data.notifyWeeklyDigest = parsed.data.notifyWeeklyDigest;

  if (Object.keys(data).length === 0) {
    return err("bad_request", "No fields to update", 400);
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data,
    select: PREFS_SELECT,
  });

  return ok(updated);
}
