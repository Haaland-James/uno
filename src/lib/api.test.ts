import { describe, expect, it } from "vitest";
import { getClientIp } from "./api";

function requestWith(headers: Record<string, string>) {
  return new Request("http://localhost", { headers });
}

describe("getClientIp", () => {
  it("uses the rightmost forwarded-for hop to avoid trusting a spoofed first value", () => {
    const req = requestWith({
      "x-forwarded-for": "203.0.113.200, 198.51.100.24",
      "x-real-ip": "198.51.100.24",
    });

    expect(getClientIp(req)).toBe("198.51.100.24");
  });

  it("falls back to x-real-ip when forwarded-for is absent", () => {
    expect(getClientIp(requestWith({ "x-real-ip": "198.51.100.24" }))).toBe("198.51.100.24");
  });

  it("returns unknown when no proxy IP headers are present", () => {
    expect(getClientIp(requestWith({}))).toBe("unknown");
  });
});
