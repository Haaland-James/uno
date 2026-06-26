import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { setPasswordSchema } from "@/lib/validators/user";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return err("unauthorized", "Sign in to set your password", 401);
  }

  const body = await req.json().catch(() => null);
  if (!body) return err("bad_request", "Invalid JSON body", 400);

  const parsed = setPasswordSchema.safeParse(body);
  if (!parsed.success) return zodErr(parsed.error);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user) return err("not_found", "User not found", 404);

  if (user.passwordHash) {
    if (!parsed.data.currentPassword) {
      return err("validation_error", "Current password is required", 400);
    }
    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return err("validation_error", "Current password is incorrect", 400);
    }
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 10);

  await db.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hash },
  });

  return ok({ ok: true });
}
