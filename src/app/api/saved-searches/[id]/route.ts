import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { updateSavedSearchSchema } from "@/lib/validators/saved-search";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** PATCH /api/saved-searches/[id] — rename, toggle active, change notify prefs */
export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("unauthenticated", "Sign in", 401);

  const existing = await db.savedSearch.findFirst({
    where: { id: ctx.params.id, userId: session.user.id },
  });
  if (!existing) return err("not_found", "Saved search not found", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("bad_json", "Invalid JSON", 400);
  }
  const parsed = updateSavedSearchSchema.safeParse(body);
  if (!parsed.success) return zodErr(parsed.error);

  const updated = await db.savedSearch.update({
    where: { id: existing.id },
    data: parsed.data,
  });
  return ok(updated);
}

/** DELETE /api/saved-searches/[id] */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("unauthenticated", "Sign in", 401);

  const existing = await db.savedSearch.findFirst({
    where: { id: ctx.params.id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) return err("not_found", "Saved search not found", 404);

  await db.savedSearch.delete({ where: { id: existing.id } });
  return ok({ deleted: true, id: existing.id });
}
