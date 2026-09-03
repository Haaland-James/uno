import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { sendAccountDeactivatedEmail, sendBestEffort } from "@/lib/email";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return err("unauthorized", "Sign in first", 401);
  }

  const deactivatedAt = new Date();

  const [user] = await db.$transaction([
    db.user.update({
      where: { id: session.user.id },
      data: { deactivatedAt },
      select: { email: true },
    }),
    db.property.updateMany({
      where: { landlordId: session.user.id, status: "ACTIVE" },
      data: { status: "PAUSED" },
    }),
  ]);

  await sendBestEffort(
    () => sendAccountDeactivatedEmail({ to: user.email, deactivatedAt }),
    "account-deactivated"
  );

  return ok({ ok: true });
}
