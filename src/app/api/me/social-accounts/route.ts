import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return err("unauthorized", "Sign in first", 401);
  }

  const accounts = await db.account.findMany({
    where: { userId: session.user.id },
    select: { provider: true },
  });

  return ok(accounts.map((a) => a.provider));
}
