import { describe, it, expect } from "vitest";
import { normalizePhone, isValidPhone } from "./phone";

describe("normalizePhone", () => {
  // The five worked examples from the module's own docblock. If one of these
  // ever fails, either the behaviour regressed or the doc is lying.
  it.each([
    ["08012345678", "+2348012345678"],
    ["8012345678", "+2348012345678"],
    ["2348012345678", "+2348012345678"],
    ["+2348012345678", "+2348012345678"],
    ["+1 555 123 4567", "+15551234567"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("strips spaces, dashes and parentheses", () => {
    expect(normalizePhone("(080) 1234-5678")).toBe("+2348012345678");
  });

  it("returns null for empty input", () => {
    expect(normalizePhone("")).toBeNull();
  });

  it("returns null for a +-prefixed number that is too short to be real", () => {
    expect(normalizePhone("+123")).toBeNull();
  });

  it("only strips a leading 0 when defaulting to Nigeria", () => {
    // With a non-NG default the leading 0 is significant, so it is preserved
    // and the country code is prepended around it.
    expect(normalizePhone("08012345678", "44")).toBe("+4408012345678");
  });

  it("does not double-prefix a number already carrying its country code", () => {
    expect(normalizePhone("2348012345678")).toBe("+2348012345678");
    expect(normalizePhone("+2348012345678")).toBe("+2348012345678");
  });
});

describe("isValidPhone", () => {
  it("accepts the common Nigerian mobile forms", () => {
    for (const n of ["08012345678", "07012345678", "09012345678", "+2348012345678"]) {
      expect(isValidPhone(n)).toBe(true);
    }
  });

  it("rejects empty and non-numeric input", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("not a phone")).toBe(false);
  });

  it("is stricter than normalizePhone at the short end", () => {
    // normalizePhone counts the "+" toward its length check, so a 7-digit
    // international number survives normalization; isValidPhone is the gate
    // that actually enforces the 8-digit E.164 minimum.
    expect(normalizePhone("+1234567")).toBe("+1234567");
    expect(isValidPhone("+1234567")).toBe(false);
  });

  it("rejects a number longer than E.164 allows", () => {
    expect(isValidPhone("+1234567890123456")).toBe(false);
  });
});
