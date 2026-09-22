import { describe, it, expect } from "vitest";
import { requestOtpSchema, verifyOtpSchema } from "./auth";

describe("requestOtpSchema", () => {
  it("accepts a minimal login request", () => {
    expect(requestOtpSchema.safeParse({ email: "ada@example.com", purpose: "LOGIN" }).success).toBe(true);
  });

  it("trims and lowercases the email before anything else sees it", () => {
    // Normalising here is what stops "Ada@Example.com" and "ada@example.com"
    // becoming two accounts, and what makes the OTP lookup match on verify.
    expect(requestOtpSchema.parse({ email: "  Ada@Example.COM  ", purpose: "LOGIN" }).email).toBe(
      "ada@example.com"
    );
  });

  it("rejects a malformed email", () => {
    for (const email of ["", "nope", "a@", "@b.com", "a b@c.com"]) {
      expect(requestOtpSchema.safeParse({ email, purpose: "LOGIN" }).success).toBe(false);
    }
  });

  it("accepts only the two purposes", () => {
    expect(requestOtpSchema.safeParse({ email: "a@b.com", purpose: "SIGNUP" }).success).toBe(true);
    expect(requestOtpSchema.safeParse({ email: "a@b.com", purpose: "RESET" }).success).toBe(false);
    expect(requestOtpSchema.safeParse({ email: "a@b.com" }).success).toBe(false);
  });

  it("carries the optional signup fields", () => {
    const parsed = requestOtpSchema.parse({
      email: "a@b.com",
      purpose: "SIGNUP",
      name: "  Ada Obi  ",
      phone: " 08012345678 ",
    });
    expect(parsed.name).toBe("Ada Obi");
    expect(parsed.phone).toBe("08012345678");
  });

  it("rejects an empty name once one is supplied", () => {
    expect(requestOtpSchema.safeParse({ email: "a@b.com", purpose: "SIGNUP", name: "   " }).success).toBe(
      false
    );
  });

  it("caps the optional fields", () => {
    expect(
      requestOtpSchema.safeParse({ email: "a@b.com", purpose: "SIGNUP", name: "a".repeat(101) }).success
    ).toBe(false);
    expect(
      requestOtpSchema.safeParse({ email: "a@b.com", purpose: "LOGIN", phone: "0".repeat(21) }).success
    ).toBe(false);
  });

  it("carries the agentOnly gate flag", () => {
    // Set by the staff portal so a non-agent email cannot request a code there.
    expect(
      requestOtpSchema.parse({ email: "a@b.com", purpose: "LOGIN", agentOnly: true }).agentOnly
    ).toBe(true);
    expect(requestOtpSchema.parse({ email: "a@b.com", purpose: "LOGIN" }).agentOnly).toBeUndefined();
  });

  it("rejects a non-boolean agentOnly rather than coercing it", () => {
    expect(
      requestOtpSchema.safeParse({ email: "a@b.com", purpose: "LOGIN", agentOnly: "true" }).success
    ).toBe(false);
  });
});

describe("verifyOtpSchema", () => {
  const valid = { email: "ada@example.com", code: "123456", purpose: "LOGIN" };

  it("accepts a six-digit code", () => {
    expect(verifyOtpSchema.safeParse(valid).success).toBe(true);
    expect(verifyOtpSchema.safeParse({ ...valid, code: "000000" }).success).toBe(true);
  });

  it("rejects codes that are not exactly six digits", () => {
    for (const code of ["", "12345", "1234567", "12345a", "12 345", " 123456", "abcdef"]) {
      expect(verifyOtpSchema.safeParse({ ...valid, code }).success, code).toBe(false);
    }
  });

  it("normalises the email the same way the request side does", () => {
    // If these two disagreed, a code requested for "Ada@Example.com" could
    // never be verified.
    expect(verifyOtpSchema.parse({ ...valid, email: "  Ada@Example.COM  " }).email).toBe(
      "ada@example.com"
    );
  });

  it("requires a purpose", () => {
    expect(verifyOtpSchema.safeParse({ email: "a@b.com", code: "123456" }).success).toBe(false);
  });
});
