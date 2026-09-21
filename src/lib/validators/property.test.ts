import { describe, it, expect, afterEach, vi } from "vitest";
import {
  propertyCreateSchema,
  propertyUpdateSchema,
  propertyWizardSubmitSchema,
  propertyFilterSchema,
} from "./property";

afterEach(() => {
  vi.unstubAllEnvs();
});

const validCreate = {
  title: "Lovely two bedroom flat in Uyo",
  propertyType: "FLAT",
  bedrooms: 2,
  bathrooms: 2,
  city: "Uyo",
  area: "Ewet Housing",
  rent: 500000,
};

describe("propertyCreateSchema", () => {
  it("accepts a minimal valid listing and applies defaults", () => {
    const parsed = propertyCreateSchema.parse(validCreate);
    expect(parsed).toMatchObject({
      amenities: [],
      customAmenities: [],
      fullAddressVisible: false,
      rentPeriod: "YEAR",
      negotiable: false,
      availabilityStatus: "AVAILABLE_NOW",
    });
  });

  it("defaults fullAddressVisible to false", () => {
    // Privacy has to be the default: a listing that forgets the field must not
    // publish its exact street.
    expect(propertyCreateSchema.parse(validCreate).fullAddressVisible).toBe(false);
  });

  it("enforces the title length bounds", () => {
    expect(propertyCreateSchema.safeParse({ ...validCreate, title: "Too short" }).success).toBe(false);
    expect(propertyCreateSchema.safeParse({ ...validCreate, title: "a".repeat(101) }).success).toBe(false);
    expect(propertyCreateSchema.safeParse({ ...validCreate, title: "a".repeat(100) }).success).toBe(true);
  });

  it("enforces the rent floor and ceiling", () => {
    expect(propertyCreateSchema.safeParse({ ...validCreate, rent: 9999 }).success).toBe(false);
    expect(propertyCreateSchema.safeParse({ ...validCreate, rent: 10000 }).success).toBe(true);
    expect(propertyCreateSchema.safeParse({ ...validCreate, rent: 100000001 }).success).toBe(false);
  });

  it("rejects an unknown property type", () => {
    expect(propertyCreateSchema.safeParse({ ...validCreate, propertyType: "CASTLE" }).success).toBe(false);
  });

  it("caps bedrooms and bathrooms at 20", () => {
    expect(propertyCreateSchema.safeParse({ ...validCreate, bedrooms: 21 }).success).toBe(false);
    expect(propertyCreateSchema.safeParse({ ...validCreate, bedrooms: -1 }).success).toBe(false);
    expect(propertyCreateSchema.safeParse({ ...validCreate, bedrooms: 0 }).success).toBe(true);
  });

  it("requires a city and an area", () => {
    expect(propertyCreateSchema.safeParse({ ...validCreate, city: "" }).success).toBe(false);
    expect(propertyCreateSchema.safeParse({ ...validCreate, area: "" }).success).toBe(false);
  });

  it("rejects a yearBuilt in the future", () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(propertyCreateSchema.safeParse({ ...validCreate, yearBuilt: nextYear }).success).toBe(false);
    expect(propertyCreateSchema.safeParse({ ...validCreate, yearBuilt: 2020 }).success).toBe(true);
    expect(propertyCreateSchema.safeParse({ ...validCreate, yearBuilt: 1949 }).success).toBe(false);
  });

  it("bounds latitude and longitude to real coordinates", () => {
    expect(propertyCreateSchema.safeParse({ ...validCreate, latitude: 91 }).success).toBe(false);
    expect(propertyCreateSchema.safeParse({ ...validCreate, longitude: 181 }).success).toBe(false);
    expect(propertyCreateSchema.safeParse({ ...validCreate, latitude: 5.03, longitude: 7.93 }).success).toBe(true);
  });

  it("caps custom amenities at ten", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => `amenity ${i}`);
    expect(propertyCreateSchema.safeParse({ ...validCreate, customAmenities: eleven }).success).toBe(false);
  });
});

describe("photo URL allowlist", () => {
  // Photos are the one field that becomes a public <img src>, so the allowlist
  // is what stops a listing from embedding an arbitrary remote host. Exercised
  // through the wizard schema, which is where photos are actually submitted.
  const withPhotos = (urls: string[]) => ({
    objective: "RENT",
    state: "Akwa Ibom",
    city: "Uyo",
    area: "Ewet Housing",
    title: "Lovely flat",
    propertyType: "FLAT",
    bedrooms: 2,
    bathrooms: 2,
    photos: urls.map((url) => ({ url })),
  });

  const accepts = (url: string) =>
    propertyWizardSubmitSchema.safeParse(withPhotos([url])).success;

  it("accepts the hosts we actually serve images from", () => {
    expect(accepts("https://res.cloudinary.com/demo/image/upload/a.jpg")).toBe(true);
    expect(accepts("https://images.unsplash.com/photo-123")).toBe(true);
  });

  it("rejects any other host", () => {
    expect(accepts("https://evil.example.com/a.jpg")).toBe(false);
    expect(accepts("https://res.cloudinary.com.evil.com/a.jpg")).toBe(false);
  });

  it("rejects non-https schemes", () => {
    expect(accepts("http://res.cloudinary.com/demo/image/upload/a.jpg")).toBe(false);
    expect(accepts("javascript:alert(1)")).toBe(false);
    expect(accepts("data:image/png;base64,iVBORw0KGgo=")).toBe(false);
  });

  it("rejects strings that are not URLs at all", () => {
    expect(accepts("not a url")).toBe(false);
    expect(accepts("")).toBe(false);
  });

  it("confines Cloudinary URLs to our own cloud when the cloud name is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "uno-cloud");
    expect(accepts("https://res.cloudinary.com/uno-cloud/image/upload/a.jpg")).toBe(true);
    // Someone else's Cloudinary account is still res.cloudinary.com.
    expect(accepts("https://res.cloudinary.com/attacker/image/upload/a.jpg")).toBe(false);
    // And a cloud name that merely starts the same must not slip through.
    expect(accepts("https://res.cloudinary.com/uno-cloud-evil/image/upload/a.jpg")).toBe(false);
  });

  it("still allows the other permitted host when a cloud name is set", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "uno-cloud");
    expect(accepts("https://images.unsplash.com/photo-123")).toBe(true);
  });

  it("requires at least one photo", () => {
    expect(propertyWizardSubmitSchema.safeParse(withPhotos([])).success).toBe(false);
  });

  it("rejects a batch where only one photo is bad", () => {
    expect(
      accepts("https://res.cloudinary.com/demo/image/upload/a.jpg") &&
        propertyWizardSubmitSchema.safeParse(
          withPhotos([
            "https://res.cloudinary.com/demo/image/upload/a.jpg",
            "https://evil.example.com/b.jpg",
          ])
        ).success
    ).toBe(false);
  });

  it("caps the URL length", () => {
    expect(accepts(`https://res.cloudinary.com/demo/${"a".repeat(600)}.jpg`)).toBe(false);
  });
});

describe("propertyWizardSubmitSchema", () => {
  const valid = {
    objective: "RENT",
    state: "Akwa Ibom",
    city: "Uyo",
    area: "Ewet Housing",
    title: "Lovely flat",
    propertyType: "FLAT",
    bedrooms: 2,
    bathrooms: 2,
    photos: [{ url: "https://res.cloudinary.com/demo/image/upload/a.jpg" }],
  };

  it("accepts the minimum the wizard can submit", () => {
    expect(propertyWizardSubmitSchema.safeParse(valid).success).toBe(true);
  });

  it("fills the optional string fields with empty strings", () => {
    const parsed = propertyWizardSubmitSchema.parse(valid);
    expect(parsed.streetAddress).toBe("");
    expect(parsed.offPlatformOwnerName).toBe("");
    expect(parsed.rentPeriod).toBe("YEAR");
    expect(parsed.availability).toBe("AVAILABLE_NOW");
  });

  it("accepts submissions without a title and strips stale or forged titles", () => {
    expect(propertyWizardSubmitSchema.safeParse({ ...valid, title: undefined }).success).toBe(true);
    expect(propertyWizardSubmitSchema.parse({ ...valid, title: "Client marketing" })).not.toHaveProperty("title");
  });

  it("accepts null bedrooms for land and commercial listings", () => {
    expect(
      propertyWizardSubmitSchema.safeParse({ ...valid, bedrooms: null, bathrooms: null }).success
    ).toBe(true);
  });

  it("requires state, city and area", () => {
    for (const field of ["state", "city", "area"]) {
      expect(propertyWizardSubmitSchema.safeParse({ ...valid, [field]: "" }).success).toBe(false);
    }
  });

  it("accepts an empty contact email but rejects a malformed one", () => {
    expect(propertyWizardSubmitSchema.safeParse({ ...valid, contactEmail: "" }).success).toBe(true);
    expect(propertyWizardSubmitSchema.safeParse({ ...valid, contactEmail: "nope" }).success).toBe(false);
    expect(
      propertyWizardSubmitSchema.safeParse({ ...valid, contactEmail: "a@b.com" }).success
    ).toBe(true);
  });

  it("rejects an unknown objective", () => {
    expect(propertyWizardSubmitSchema.safeParse({ ...valid, objective: "DONATE" }).success).toBe(false);
  });

  it("accepts a percentage-mode agency fee", () => {
    const parsed = propertyWizardSubmitSchema.parse({
      ...valid,
      agencyFee: { mode: "PERCENT", value: 10 },
    });
    expect(parsed.agencyFee).toEqual({ mode: "PERCENT", value: 10 });
  });
});

describe("propertyUpdateSchema", () => {
  it("accepts an empty patch", () => {
    expect(propertyUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a single-field patch", () => {
    expect(propertyUpdateSchema.safeParse({ rent: 750000 }).success).toBe(true);
  });

  it("still enforces the create schema's bounds on the fields it does carry", () => {
    expect(propertyUpdateSchema.safeParse({ rent: 500 }).success).toBe(false);
    expect(propertyUpdateSchema.parse({ title: "Client marketing" })).not.toHaveProperty("title");
  });

  it("lets the edit page clear a field by sending null", () => {
    // These come through the base schema as merely optional; the edit-by-section
    // UI clears them with an explicit null.
    for (const field of ["description", "condition", "floorNumber", "streetAddress", "minimumLease"]) {
      expect(propertyUpdateSchema.safeParse({ [field]: null }).success).toBe(true);
    }
  });

  it("does not accept availabilityStatus, which is derived rather than set", () => {
    const parsed = propertyUpdateSchema.parse({ availabilityStatus: "RENTED" } as never);
    expect(parsed).not.toHaveProperty("availabilityStatus");
  });

  it("accepts the wider edit-only fields", () => {
    expect(
      propertyUpdateSchema.safeParse({
        state: "Akwa Ibom",
        agencyFeeMode: "PERCENT",
        parkingSpaces: 2,
        surveyAvailable: true,
      }).success
    ).toBe(true);
  });

  it("still rejects a bad photo URL on update", () => {
    expect(
      propertyUpdateSchema.safeParse({ photos: [{ url: "https://evil.example.com/a.jpg" }] }).success
    ).toBe(false);
  });
});

describe("propertyFilterSchema", () => {
  it("accepts an empty filter", () => {
    expect(propertyFilterSchema.safeParse({}).success).toBe(true);
  });

  it("accepts the known sort values and rejects others", () => {
    expect(propertyFilterSchema.safeParse({ sortBy: "price_asc" }).success).toBe(true);
    expect(propertyFilterSchema.safeParse({ sortBy: "random" }).success).toBe(false);
  });

  it("rejects a negative price bound", () => {
    expect(propertyFilterSchema.safeParse({ minPrice: -1 }).success).toBe(false);
  });
});
