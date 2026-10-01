import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/api";
import { propertyViewLimiter } from "@/lib/ratelimit";
import { isLikelyBot, lagosDay, viewerKey } from "@/lib/view-tracking";

// Always 204: the client fires and forgets, and a uniform response gives
// anyone gaming the counter nothing to probe (rate-limited looks the same).
const noContent = () => new Response(null, { status: 204 });

/**
 * POST /api/properties/[id]/view — record one de-duped view.
 *
 * Called only by the property detail page. GET /api/properties/[id] no longer
 * counts, because the map popup and the edit page fetch it too.
 *
 * One PropertyView row per viewer per listing per Lagos day (unique key); the
 * Property.views counter is bumped only when that row is actually inserted.
 * Owners, admins, bots, non-ACTIVE listings and rate-limited IPs are no-ops.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;
  const ua = req.headers.get("user-agent");
  if (isLikelyBot(ua)) return noContent();

  const ip = getClientIp(req);
  try {
    const rl = await propertyViewLimiter.limit(`${ip}:${id}`);
    if (!rl.success) return noContent();
  } catch (e) {
    // Redis down: skip counting rather than count unguarded.
    console.error("[property:view] rate limiter failed", e);
    return noContent();
  }

  try {
    const [property, session] = await Promise.all([
      db.property.findUnique({
        where: { id },
        select: { landlordId: true, status: true, deletedAt: true },
      }),
      getServerSession(authOptions),
    ]);
    if (!property || property.deletedAt || property.status !== "ACTIVE") return noContent();

    const userId = session?.user?.id ?? null;
    if (userId === property.landlordId || session?.user?.role === "ADMIN") return noContent();

    const secret = process.env.NEXTAUTH_SECRET;
    if (!userId && !secret) return noContent();

    const day = lagosDay();
    const key = viewerKey({ userId, ip, ua: ua ?? "", day, secret: secret ?? "" });

    await db.$transaction(async (tx) => {
      const { count } = await tx.propertyView.createMany({
        data: [{ propertyId: id, userId, viewerKey: key, day }],
        skipDuplicates: true,
      });
      if (count === 1) {
        await tx.property.update({ where: { id }, data: { views: { increment: 1 } } });
      }
    });
  } catch (e) {
    console.error("[property:view] record failed", e);
  }
  return noContent();
}
