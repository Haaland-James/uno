import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, err, zodErr, getClientIp } from "@/lib/api";
import { geocodeLimiter } from "@/lib/ratelimit";

/**
 * Forward-geocode proxy. The client never sees `MAPBOX_SERVER_TOKEN` and we
 * get to rate-limit per session/IP before paying Mapbox.
 *
 * GET /api/geocode?q=lekki&proximity=3.45,6.43&limit=5
 */

const NG_BBOX = "2.6917,4.2406,14.6776,13.8659";

/**
 * Prefer the server-only token; fall back to the public token so geocoding
 * doesn't silently break in dev environments that haven't provisioned a
 * separate server token yet. Warn once per process so it gets fixed for prod.
 */
let warnedPublicFallback = false;
function getToken(): string | null {
  const server = process.env.MAPBOX_SERVER_TOKEN;
  if (server) return server;
  const pub = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (pub) {
    if (!warnedPublicFallback) {
      console.warn(
        "[geocode] MAPBOX_SERVER_TOKEN not set — falling back to NEXT_PUBLIC_MAPBOX_TOKEN. " +
          "Set a geocoding-scoped server token before deploying to prod (see docs/mapbox.md)."
      );
      warnedPublicFallback = true;
    }
    return pub;
  }
  return null;
}

const querySchema = z.object({
  q: z.string().trim().min(2).max(120),
  proximity: z
    .string()
    .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(10).optional(),
});

type MapboxFeature = {
  id: string;
  place_name: string;
  center: [number, number];
  properties?: { accuracy?: string };
  context?: { id: string; text: string }[];
};

export async function GET(req: NextRequest) {
  const token = getToken();
  if (!token) {
    return err("server_error", "Geocoding is not configured", 503);
  }

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return zodErr(parsed.error);
  const { q, proximity, limit = 5 } = parsed.data;

  const rl = await geocodeLimiter.limit(getClientIp(req));
  if (!rl.success) return err("rate_limited", "Too many geocode requests", 429);

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("country", "ng");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("bbox", NG_BBOX);
  if (proximity) url.searchParams.set("proximity", proximity);

  const res = await fetch(url.toString(), {
    // 24h CDN cache by query — Mapbox geocoding is effectively static.
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    return err("upstream_error", `Geocode upstream ${res.status}`, 502);
  }
  const json = (await res.json()) as { features?: MapboxFeature[] };
  const features = (json.features ?? []).map((f) => ({
    id: f.id,
    place_name: f.place_name,
    center: f.center,
    accuracy: f.properties?.accuracy,
    context: f.context?.map((c) => ({ id: c.id, text: c.text })) ?? [],
  }));
  return ok({ features });
}
