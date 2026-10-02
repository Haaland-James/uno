import { describe, expect, it } from "vitest";
import { MAX_PRICE } from "@/lib/validators/property";
import type { ListPropertyData } from "@/stores/listPropertyStore";
import { PRICE_TOO_LARGE, isStepValid, priceError } from "./validation";

const base = { objective: "SELL", propertyKind: "RESIDENTIAL", salePrice: null, rent: null, minimumLease: "1_YEAR" } as unknown as ListPropertyData;
const sale = (salePrice: number | null) => ({ ...base, objective: "SELL", salePrice }) as ListPropertyData;
const rent = (value: number | null) => ({ ...base, objective: "RENT", rent: value }) as ListPropertyData;

describe("the pricing step stops a price the server would refuse", () => {
  it("the message matches the server's, built from MAX_PRICE rather than a copied number", () => {
    expect(PRICE_TOO_LARGE).toBe(`Maximum price is ₦${MAX_PRICE.toLocaleString("en-NG")}`);
    expect(PRICE_TOO_LARGE).toBe("Maximum price is ₦1,000,000,000,000");
  });

  it("sale: accepts MAX_PRICE, rejects MAX_PRICE + 1, still rejects zero and empty", () => {
    expect(isStepValid("pricing", sale(MAX_PRICE))).toBe(true);
    expect(isStepValid("pricing", sale(MAX_PRICE + 1))).toBe(false);
    expect(isStepValid("pricing", sale(5_000_000_000))).toBe(true);
    expect(isStepValid("pricing", sale(0))).toBe(false);
    expect(isStepValid("pricing", sale(null))).toBe(false);
  });

  it("rent: accepts MAX_PRICE, rejects MAX_PRICE + 1, keeps the ₦10,000 minimum", () => {
    expect(isStepValid("pricing", rent(MAX_PRICE))).toBe(true);
    expect(isStepValid("pricing", rent(MAX_PRICE + 1))).toBe(false);
    expect(isStepValid("pricing", rent(10_000))).toBe(true);
    expect(isStepValid("pricing", rent(9_999))).toBe(false);
  });

  it("priceError is the sentence for a too-large price and null otherwise", () => {
    expect(priceError(MAX_PRICE + 1)).toBe(PRICE_TOO_LARGE);
    expect(priceError(MAX_PRICE)).toBeNull();
    expect(priceError(0)).toBeNull();
    expect(priceError(null)).toBeNull();
    expect(priceError(undefined)).toBeNull();
  });
});
