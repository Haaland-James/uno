import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { createSavedSearchSchema } from "@/lib/validators/saved-search";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_PER_USER = 50;

/** GET /api/saved-searches — list current user's saved searches, newest first */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("unauthenticated", "Sign in to view saved searches", 401);

  const items = await db.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return ok({ items, total: items.length });
}

/** POST /api/saved-searches — create new */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("unauthenticated", "Sign in to save searches", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("bad_json", "Invalid JSON", 400);
  }

  const parsed = createSavedSearchSchema.safeParse(body);
  if (!parsed.success) return zodErr(parsed.error);

  const count = await db.savedSearch.count({ where: { userId: session.user.id } });
  if (count >= MAX_PER_USER) {
    return err("limit_reached", `You can save up to ${MAX_PER_USER} searches.`, 409);
  }

  const created = await db.savedSearch.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      criteria: parsed.data.criteria,
      notifyInstant: parsed.data.notifyInstant ?? true,
      notifyEmail: parsed.data.notifyEmail ?? false,
    },
  });

  return ok(created, { status: 201 });
}
