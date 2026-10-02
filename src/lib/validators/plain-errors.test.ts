import { describe, expect, it } from "vitest";
import {
  MAX_PRICE,
  parseListingSubmit,
  parseListingUpdate,
  propertyUpdateSchema,
  propertyWizardSubmitSchema,
} from "./property";
import { FIELD_LABELS } from "./plain-errors";

const photo = { url: "https://images.unsplash.com/a.jpg" };
const valid = {
  objective: "SELL",
  state: "Akwa Ibom",
  city: "Uyo",
  area: "Ewet",
  propertyType: "HOUSE",
  bedrooms: 3,
  bathrooms: 2,
  photos: [photo],
  salePrice: 5_000_000,
};

/** Messages the parser gives for `patch` applied to a valid payload, keyed by field. */
const errorsFor = (patch: Record<string, unknown>, parse = parseListingSubmit): Record<string, string[]> => {
  const result = parse({ ...valid, ...patch });
  return result.success ? {} : (result.error.flatten().fieldErrors as Record<string, string[]>);
};

// Anything that reads like Zod's own wording: "Expected integer, received float", "Invalid input", "Required".
const ZOD_SPEAK = /\b(expected|received|invalid)\b|^Required$|String must|Number must|Array must/i;

describe("plain messages for the examples in the brief", () => {
  it.each([
    [{ salePrice: MAX_PRICE + 1 }, "salePrice", "Maximum price is ₦1,000,000,000,000"],
    [{ propertyKind: "LAND", plotSizeSqm: 450.5 }, "plotSizeSqm", "Plot size must be a whole number"],
    [{ plotSizeSqm: 0 }, "plotSizeSqm", "Plot size must be more than zero"],
    [{ floorAreaSqm: 0 }, "floorAreaSqm", "Floor area must be more than zero"],
    [{ yearBuilt: new Date().getFullYear() + 1 }, "yearBuilt", "Year built can't be in the future"],
    [{ yearBuilt: 1850 }, "yearBuilt", "Year built can't be before 1900"],
    [{ bedrooms: 21 }, "bedrooms", "Bedrooms can't be more than 20"],
    [{ bedrooms: -1 }, "bedrooms", "Bedrooms can't be negative"],
    [{ contactEmail: "nope" }, "contactEmail", "Enter a valid contact email"],
    [{ photos: [] }, "photos", "Add at least one photo"],
    [{ photos: [{ url: "https://evil.example.com/a.jpg" }] }, "photos", "That photo couldn't be used — upload it again"],
    [{ salePrice: 0 }, "salePrice", "Price must be greater than zero"],
    [{ salePrice: 1000.5 }, "salePrice", "Price must be a whole number of naira"],
    [{ state: "" }, "state", "State is required"],
    [{ parkingSpaces: 1.5 }, "parkingSpaces", "Parking spaces must be a whole number"],
    [{ cautionDeposit: -5 }, "cautionDeposit", "Caution deposit can't be negative"],
    [{ contactFirstName: 5 }, "contactFirstName", "First name must be text"],
    [{ objective: "DONATE" }, "objective", "Choose a valid option for what you're listing"],
  ])("%j → %s: %s", (patch, field, message) => {
    expect(errorsFor(patch)[field]).toContain(message);
  });

  it("explains a missing required field by name", () => {
    const result = parseListingSubmit({ ...valid, state: undefined, bedrooms: undefined });
    expect(result.success).toBe(false);
    const errors = result.success ? {} : result.error.flatten().fieldErrors;
    expect(errors.state).toEqual(["State is required"]);
    expect(errors.bedrooms).toEqual(["Bedrooms is required"]);
  });

  it("the edit schema gives plain messages too", () => {
    const errors = (patch: Record<string, unknown>) => {
      const r = parseListingUpdate(patch);
      return r.success ? {} : (r.error.flatten().fieldErrors as Record<string, string[]>);
    };
    expect(errors({ rent: MAX_PRICE + 1 }).rent).toEqual(["Maximum price is ₦1,000,000,000,000"]);
    expect(errors({ plotSizeSqm: 450.5 }).plotSizeSqm).toEqual(["Plot size must be a whole number"]);
    expect(errors({ bedrooms: 25 }).bedrooms).toEqual(["Bedrooms can't be more than 20"]);
    expect(errors({ description: "x".repeat(2001) }).description).toEqual(["Description is too long (2000 characters at most)"]);
    expect(errors({ photos: [] }).photos).toEqual(["Add at least one photo"]);
  });
});

describe("no rule falls back to Zod's own wording", () => {
  const wrongTypes: unknown[] = [{}, "text", 12.5, -1, true, ["x"], 10_000_000_000_000, "x".repeat(5000)];

  it.each(Object.keys(propertyWizardSubmitSchema.shape))("submit field %s", (field) => {
    for (const bad of wrongTypes) {
      for (const message of errorsFor({ [field]: bad })[field] ?? []) {
        expect(message, `${field} = ${JSON.stringify(bad)?.slice(0, 40)}`).not.toMatch(ZOD_SPEAK);
        expect(message.length).toBeGreaterThan(8);
      }
    }
  });

  it.each(Object.keys(propertyUpdateSchema.shape))("update field %s", (field) => {
    for (const bad of wrongTypes) {
      const r = parseListingUpdate({ [field]: bad });
      const messages = r.success ? [] : (r.error.flatten().fieldErrors as Record<string, string[]>)[field] ?? [];
      for (const message of messages) {
        expect(message, `${field} = ${JSON.stringify(bad)?.slice(0, 40)}`).not.toMatch(ZOD_SPEAK);
      }
    }
  });

  it("every field either schema accepts has a human label", () => {
    const keys = new Set([...Object.keys(propertyWizardSubmitSchema.shape), ...Object.keys(propertyUpdateSchema.shape)]);
    const unlabelled = Array.from(keys).filter((k) => !FIELD_LABELS[k] && k !== "title");
    expect(unlabelled).toEqual([]);
  });
});

describe("the words change, the rules don't", () => {
  it("still accepts and rejects exactly what it did", () => {
    expect(parseListingSubmit(valid).success).toBe(true);
    expect(parseListingSubmit({ ...valid, salePrice: MAX_PRICE }).success).toBe(true);
    expect(parseListingSubmit({ ...valid, salePrice: MAX_PRICE + 1 }).success).toBe(false);
    expect(parseListingSubmit({ ...valid, contactEmail: "" }).success).toBe(true);
    expect(parseListingUpdate({}).success).toBe(true);
    expect(parseListingUpdate({ rent: MAX_PRICE }).success).toBe(true);
  });
});
