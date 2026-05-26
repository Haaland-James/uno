import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, err, zodErr, getClientIp } from "@/lib/api";
import { geocodeLimiter } from "@/lib/ratelimit";

/**
 * Reverse-geocode proxy. Used by the listing wizard after a pin drag.
 * GET /api/reverse-geocode?lng=3.45&lat=6.43
 */

let warnedPublicFallback = false;
function getToken(): string | null {
  const server = process.env.MAPBOX_SERVER_TOKEN;
  if (server) return server;
  const pub = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (pub) {
    if (!warnedPublicFallback) {
      console.warn(
        "[reverse-geocode] MAPBOX_SERVER_TOKEN not set — falling back to NEXT_PUBLIC_MAPBOX_TOKEN."
      );
      warnedPublicFallback = true;
    }
    return pub;
  }
  return null;
}

const querySchema = z.object({
  lng: z.coerce.number().min(-180).max(180),
  lat: z.coerce.number().min(-90).max(90),
});

type MapboxFeature = {
  id: string;
  place_name: string;
  center: [number, number];
  properties?: { accuracy?: string };
};

export async function GET(req: NextRequest) {
  const token = getToken();
  if (!token) {
    return err("server_error", "Geocoding is not configured", 503);
  }

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return zodErr(parsed.error);
  const { lng, lat } = parsed.data;

  const rl = await geocodeLimiter.limit(getClientIp(req));
  if (!rl.success) return err("rate_limited", "Too many geocode requests", 429);

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) {
    return err("upstream_error", `Geocode upstream ${res.status}`, 502);
  }
  const json = (await res.json()) as { features?: MapboxFeature[] };
  const f = json.features?.[0];
  return ok({
    feature: f
      ? {
          id: f.id,
          place_name: f.place_name,
          center: f.center,
          accuracy: f.properties?.accuracy,
        }
      : null,
  });
}
