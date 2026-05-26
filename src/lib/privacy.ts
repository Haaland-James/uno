/**
 * Coord-privacy helpers. When a listing has `fullAddressVisible = false` we must
 * never expose the true lat/lng to the public surface: devtools would reveal the
 * exact street. Instead, return a *deterministic* jittered point (~100m offset)
 * keyed by the property id and pair it with `addressPrivate: true` so the map
 * can draw a radius circle.
 *
 * Determinism matters — if the jitter changed between requests the pin would
 * dance around the map on refresh, which both looks broken and (over enough
 * samples) would let an attacker triangulate the true point.
 */

const EARTH_RADIUS_M = 6_378_137;
const JITTER_RADIUS_M = 100;

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable [0,1) PRNG seeded by a single 32-bit integer (mulberry32). */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface JitteredCoords {
  lng: number;
  lat: number;
}

/**
 * Deterministically offset a coordinate by a small distance. Same id → same
 * offset, every request. Magnitude is uniform in `[0, JITTER_RADIUS_M]`.
 */
export function jitterCoords(id: string, lng: number, lat: number): JitteredCoords {
  const rand = mulberry32(hash32(id));
  const r = JITTER_RADIUS_M * Math.sqrt(rand());
  const theta = rand() * Math.PI * 2;
  const dLat = (r * Math.cos(theta)) / EARTH_RADIUS_M;
  const dLng = (r * Math.sin(theta)) / (EARTH_RADIUS_M * Math.cos((lat * Math.PI) / 180));
  return {
    lat: lat + (dLat * 180) / Math.PI,
    lng: lng + (dLng * 180) / Math.PI,
  };
}

export interface MaybePrivateCoords {
  lat: number | null;
  lng: number | null;
  addressPrivate: boolean;
}

/**
 * Apply jitter when `fullAddressVisible` is false. Returns nulls passthrough
 * when coords are missing.
 */
export function privatize(
  id: string,
  lng: number | null | undefined,
  lat: number | null | undefined,
  fullAddressVisible: boolean
): MaybePrivateCoords {
  if (lng == null || lat == null) {
    return { lng: null, lat: null, addressPrivate: !fullAddressVisible };
  }
  if (fullAddressVisible) {
    return { lng, lat, addressPrivate: false };
  }
  const j = jitterCoords(id, lng, lat);
  return { lng: j.lng, lat: j.lat, addressPrivate: true };
}

/** Radius (in metres) used for the privacy circle on the map. */
export const PRIVACY_RADIUS_M = 500;
