import { describe, it, expect } from "vitest";
import { jitterCoords, privatize, PRIVACY_RADIUS_M } from "./privacy";

/** Rough great-circle distance in metres — good enough at ~100m scale. */
function metresBetween(aLng: number, aLat: number, bLng: number, bLat: number): number {
  const R = 6_378_137;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const midLat = toRad((aLat + bLat) / 2);
  const x = dLng * Math.cos(midLat);
  return Math.sqrt(x * x + dLat * dLat) * R;
}

const UYO_LNG = 7.9327;
const UYO_LAT = 5.0377;

describe("jitterCoords", () => {
  it("is deterministic — the same id always yields the same point", () => {
    // This is the property the module's docblock calls out as load-bearing: a
    // pin that moved between requests would both look broken and, over enough
    // samples, let someone average out the true location.
    const a = jitterCoords("prop_abc123", UYO_LNG, UYO_LAT);
    const b = jitterCoords("prop_abc123", UYO_LNG, UYO_LAT);
    expect(a).toEqual(b);
  });

  it("gives different offsets to different ids", () => {
    const a = jitterCoords("prop_aaa", UYO_LNG, UYO_LAT);
    const b = jitterCoords("prop_bbb", UYO_LNG, UYO_LAT);
    expect(a).not.toEqual(b);
  });

  it("actually moves the point", () => {
    const j = jitterCoords("prop_abc123", UYO_LNG, UYO_LAT);
    expect(j.lng).not.toBe(UYO_LNG);
    expect(j.lat).not.toBe(UYO_LAT);
  });

  it("never offsets further than the 100m jitter radius", () => {
    for (let i = 0; i < 200; i++) {
      const j = jitterCoords(`prop_${i}`, UYO_LNG, UYO_LAT);
      const d = metresBetween(UYO_LNG, UYO_LAT, j.lng, j.lat);
      expect(d).toBeLessThanOrEqual(100.5); // +0.5m for float slop
    }
  });

  it("stays within the jitter radius at a high latitude", () => {
    // The longitude correction divides by cos(lat); a bug there would blow the
    // offset up far from the equator.
    const j = jitterCoords("prop_north", 18.0686, 59.3293); // Stockholm
    expect(metresBetween(18.0686, 59.3293, j.lng, j.lat)).toBeLessThanOrEqual(100.5);
  });
});

describe("privatize", () => {
  it("passes real coords straight through when the address is public", () => {
    expect(privatize("p1", UYO_LNG, UYO_LAT, true)).toEqual({
      lng: UYO_LNG,
      lat: UYO_LAT,
      addressPrivate: false,
    });
  });

  it("jitters and flags when the address is private", () => {
    const out = privatize("p1", UYO_LNG, UYO_LAT, false);
    expect(out.addressPrivate).toBe(true);
    expect(out.lng).not.toBe(UYO_LNG);
    expect(out.lat).not.toBe(UYO_LAT);
    expect(out).toEqual({ ...jitterCoords("p1", UYO_LNG, UYO_LAT), addressPrivate: true });
  });

  it("never returns the true coordinate for a private listing", () => {
    // Checked across many ids rather than one: a single unlucky seed could
    // land close to the origin by chance, but none may land exactly on it.
    for (let i = 0; i < 100; i++) {
      const out = privatize(`prop_${i}`, UYO_LNG, UYO_LAT, false);
      expect(out.addressPrivate).toBe(true);
      expect([out.lng, out.lat]).not.toEqual([UYO_LNG, UYO_LAT]);
    }
  });

  it("passes nulls through, carrying the privacy flag", () => {
    expect(privatize("p1", null, null, false)).toEqual({
      lng: null,
      lat: null,
      addressPrivate: true,
    });
    expect(privatize("p1", undefined, undefined, true)).toEqual({
      lng: null,
      lat: null,
      addressPrivate: false,
    });
  });

  it("treats a missing coord on either axis as no location at all", () => {
    expect(privatize("p1", UYO_LNG, null, true).lng).toBeNull();
    expect(privatize("p1", null, UYO_LAT, true).lat).toBeNull();
  });
});

describe("PRIVACY_RADIUS_M", () => {
  it("is wide enough that the drawn circle always contains the true point", () => {
    // The map draws a PRIVACY_RADIUS_M circle around the *jittered* point. If
    // that radius were smaller than the jitter offset the true location could
    // fall outside its own privacy circle.
    expect(PRIVACY_RADIUS_M).toBeGreaterThan(100);
  });
});
