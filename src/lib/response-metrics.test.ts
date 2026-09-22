import { describe, expect, it } from "vitest";
import { calculateResponseMetrics } from "./response-metrics";

const row = (minutes: number | null) => ({
  createdAt: new Date("2026-01-01T00:00:00Z"),
  respondedAt: minutes === null ? null : new Date(Date.parse("2026-01-01T00:00:00Z") + minutes * 60_000),
});

describe("calculateResponseMetrics", () => {
  it.each([[], [row(null), row(null), row(null)]])("handles unanswered samples %j", (...rows) => {
    expect(calculateResponseMetrics(rows)).toEqual({ responseRate: 0, avgResponseTime: null, sampleSize: rows.length });
  });
  it("counts every enquiry but averages only responses, rounded to stored minutes", () => {
    expect(calculateResponseMetrics([row(10), row(21), row(null), row(null)]))
      .toEqual({ responseRate: 50, avgResponseTime: 16, sampleSize: 4 });
  });
});
