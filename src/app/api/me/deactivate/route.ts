import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return err("unauthorized", "Sign in first", 401);
  }

  await db.$transaction([
    db.user.update({
      where: { id: session.user.id },
      data: { deactivatedAt: new Date() },
    }),
    db.property.updateMany({
      where: { landlordId: session.user.id, status: "ACTIVE" },
      data: { status: "PAUSED" },
    }),
  ]);

  return ok({ ok: true });
}
