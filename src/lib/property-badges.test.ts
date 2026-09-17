import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getTopLeftBadge, isOffMarket } from "./property-badges";
import type { PropertyCardData } from "@/types/property";

const NOW = new Date("2026-09-17T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe("getTopLeftBadge", () => {
  // The function reads Date.now() directly, so the clock has to be pinned or
  // the boundary cases would drift with wall time.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks a listing created just now as new", () => {
    expect(getTopLeftBadge(NOW)).toEqual({ kind: "new" });
  });

  it("is still new on day 7", () => {
    expect(getTopLeftBadge(daysAgo(7))).toEqual({ kind: "new" });
  });

  it("switches to listed_ago on day 8", () => {
    expect(getTopLeftBadge(daysAgo(8))).toEqual({ kind: "listed_ago", days: 8 });
  });

  it("still shows listed_ago on day 60", () => {
    expect(getTopLeftBadge(daysAgo(60))).toEqual({ kind: "listed_ago", days: 60 });
  });

  it("drops the badge entirely on day 61", () => {
    expect(getTopLeftBadge(daysAgo(61))).toBeNull();
  });

  it("accepts a date-like value, not just a Date", () => {
    // Callers hand it Prisma dates that have been through JSON over the wire.
    expect(getTopLeftBadge(NOW.toISOString() as unknown as Date)).toEqual({ kind: "new" });
  });

  it("treats a future createdAt as new rather than erroring", () => {
    const future = new Date(NOW.getTime() + 60 * 60 * 1000);
    expect(getTopLeftBadge(future)).toEqual({ kind: "new" });
  });
});

describe("isOffMarket", () => {
  const card = (availabilityStatus: string) =>
    ({ availabilityStatus } as unknown as Pick<PropertyCardData, "availabilityStatus">);

  it("is true only for RENTED", () => {
    expect(isOffMarket(card("RENTED"))).toBe(true);
  });

  it("is false for every available state", () => {
    expect(isOffMarket(card("AVAILABLE_NOW"))).toBe(false);
    expect(isOffMarket(card("AVAILABLE_FROM"))).toBe(false);
  });
});
