import { describe, it, expect } from "vitest";
import {
  loginSchema,
  signupSchema,
  profileUpdateSchema,
  setPasswordSchema,
  notificationPrefsSchema,
  landlordProfileSchema,
  contactRequestSchema,
} from "./user";

// The regex behind every phone field here: /^(\+?234|0)(70|80|81|90|91|71)\d{8}$/
const VALID_PHONES = [
  "08012345678",
  "08112345678",
  "07012345678",
  "07112345678",
  "09012345678",
  "09112345678",
  "2348012345678",
  "+2348012345678",
];

const INVALID_PHONES = [
  "", // empty
  "0801234567", // one digit short
  "080123456789", // one digit long
  "08212345678", // 082 is not an accepted prefix
  "8012345678", // missing the leading 0 or country code
  "+1 555 123 4567", // not Nigerian
  "080-1234-5678", // punctuation is not stripped by the schema
  "not a phone",
];

describe("Nigerian phone validation", () => {
  it.each(VALID_PHONES)("accepts %s", (phone) => {
    expect(loginSchema.safeParse({ phone }).success).toBe(true);
  });

  it.each(INVALID_PHONES)("rejects %s", (phone) => {
    expect(loginSchema.safeParse({ phone }).success).toBe(false);
  });

  it("does not normalise — it only validates", () => {
    // Worth pinning: callers that need E.164 must run normalizePhone
    // themselves, because this schema hands back exactly what it was given.
    expect(loginSchema.parse({ phone: "08012345678" }).phone).toBe("08012345678");
  });

  it("applies the same rule across every phone field", () => {
    expect(signupSchema.safeParse({ name: "Ada", phone: "08212345678" }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ phone: "08212345678" }).success).toBe(false);
    expect(landlordProfileSchema.safeParse({ whatsappNumber: "08212345678" }).success).toBe(false);
    expect(
      contactRequestSchema.safeParse({ propertyId: "p1", tenantName: "Ada", tenantPhone: "08212345678" })
        .success
    ).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = { name: "Ada Obi", phone: "08012345678" };

  it("defaults new accounts to RENTER", () => {
    // Listing is an action, not an identity — everyone starts as a renter.
    expect(signupSchema.parse(valid).role).toBe("RENTER");
  });

  it("accepts an explicit LANDLORD role", () => {
    expect(signupSchema.parse({ ...valid, role: "LANDLORD" }).role).toBe("LANDLORD");
  });

  it("rejects a role outside the enum", () => {
    expect(signupSchema.safeParse({ ...valid, role: "ADMIN" }).success).toBe(false);
  });

  it("enforces the name length bounds", () => {
    expect(signupSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, name: "a".repeat(101) }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, name: "Ad" }).success).toBe(true);
  });

  it("treats email as optional, allowing an empty string", () => {
    expect(signupSchema.safeParse({ ...valid, email: "" }).success).toBe(true);
    expect(signupSchema.safeParse({ ...valid, email: "ada@example.com" }).success).toBe(true);
    expect(signupSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  it("accepts an empty patch", () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("allows clearing the optional string fields with an empty string", () => {
    expect(profileUpdateSchema.safeParse({ phone: "", address: "", photo: "" }).success).toBe(true);
  });

  it("accepts the gender options including an explicit null", () => {
    for (const gender of ["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY", null]) {
      expect(profileUpdateSchema.safeParse({ gender }).success).toBe(true);
    }
    expect(profileUpdateSchema.safeParse({ gender: "OTHER" }).success).toBe(false);
  });

  it("requires photo to be a URL when given", () => {
    expect(profileUpdateSchema.safeParse({ photo: "not-a-url" }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ photo: "https://example.com/a.jpg" }).success).toBe(true);
  });

  it("caps the address length", () => {
    expect(profileUpdateSchema.safeParse({ address: "a".repeat(301) }).success).toBe(false);
  });
});

describe("setPasswordSchema", () => {
  it("requires at least eight characters", () => {
    expect(setPasswordSchema.safeParse({ newPassword: "short12" }).success).toBe(false);
    expect(setPasswordSchema.safeParse({ newPassword: "longenough" }).success).toBe(true);
  });

  it("caps the password at 128 characters", () => {
    expect(setPasswordSchema.safeParse({ newPassword: "a".repeat(129) }).success).toBe(false);
  });

  it("treats currentPassword as optional, for first-time password setup", () => {
    expect(setPasswordSchema.safeParse({ newPassword: "longenough" }).success).toBe(true);
    expect(
      setPasswordSchema.safeParse({ currentPassword: "old", newPassword: "longenough" }).success
    ).toBe(true);
  });
});

describe("notificationPrefsSchema", () => {
  it("accepts an empty patch and any subset of flags", () => {
    expect(notificationPrefsSchema.safeParse({}).success).toBe(true);
    expect(notificationPrefsSchema.safeParse({ notifyPriceDrops: true }).success).toBe(true);
  });

  it("rejects a non-boolean flag", () => {
    expect(notificationPrefsSchema.safeParse({ notifyWeeklyDigest: "yes" }).success).toBe(false);
  });
});

describe("landlordProfileSchema", () => {
  it("applies its defaults", () => {
    const parsed = landlordProfileSchema.parse({});
    expect(parsed).toMatchObject({
      landlordType: "INDIVIDUAL",
      contactMethod: "WHATSAPP",
      availableDays: [],
    });
  });

  it("caps the bio", () => {
    expect(landlordProfileSchema.safeParse({ bio: "a".repeat(501) }).success).toBe(false);
  });

  it("rejects an unknown contact method", () => {
    expect(landlordProfileSchema.safeParse({ contactMethod: "CARRIER_PIGEON" }).success).toBe(false);
  });
});

describe("contactRequestSchema", () => {
  const valid = { propertyId: "p1", tenantName: "Ada", tenantPhone: "08012345678" };

  it("accepts a minimal request and defaults to WhatsApp", () => {
    expect(contactRequestSchema.parse(valid).contactMethod).toBe("WHATSAPP");
  });

  it("requires a property id and a name of at least two characters", () => {
    expect(contactRequestSchema.safeParse({ ...valid, propertyId: "" }).success).toBe(false);
    expect(contactRequestSchema.safeParse({ ...valid, tenantName: "A" }).success).toBe(false);
  });

  it("treats the tenant email as optional", () => {
    expect(contactRequestSchema.safeParse({ ...valid, tenantEmail: "" }).success).toBe(true);
    expect(contactRequestSchema.safeParse({ ...valid, tenantEmail: "nope" }).success).toBe(false);
  });

  it("caps the message", () => {
    expect(contactRequestSchema.safeParse({ ...valid, message: "a".repeat(501) }).success).toBe(false);
  });
});
