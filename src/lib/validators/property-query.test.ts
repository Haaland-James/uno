import { describe, it, expect } from "vitest";
import { propertyListQuerySchema, featuredQuerySchema } from "./property-query";

/** Parse the way a route handler does: straight off URLSearchParams. */
const fromQuery = (q: string) =>
  propertyListQuerySchema.safeParse(Object.fromEntries(new URLSearchParams(q)));

describe("propertyListQuerySchema — defaults", () => {
  it("defaults to the first page of twenty", () => {
    const parsed = propertyListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });

  it("coerces stringy paging params", () => {
    const parsed = propertyListQuerySchema.parse({ page: "3", pageSize: "50" });
    expect(parsed.page).toBe(3);
    expect(parsed.pageSize).toBe(50);
  });

  it("rejects a page below 1", () => {
    expect(propertyListQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(propertyListQuerySchema.safeParse({ page: "-1" }).success).toBe(false);
  });

  it("caps pageSize at 50 so a query cannot ask for the whole table", () => {
    expect(propertyListQuerySchema.safeParse({ pageSize: "51" }).success).toBe(false);
    expect(propertyListQuerySchema.safeParse({ pageSize: "50" }).success).toBe(true);
  });

  it("rejects a fractional page", () => {
    expect(propertyListQuerySchema.safeParse({ page: "1.5" }).success).toBe(false);
  });
});

describe("propertyListQuerySchema — comma-separated lists", () => {
  it("splits a comma-separated type list", () => {
    const res = fromQuery("type=FLAT,HOUSE");
    expect(res.success && res.data.type).toEqual(["FLAT", "HOUSE"]);
  });

  it("trims whitespace and drops empty entries", () => {
    const res = fromQuery("type=FLAT,%20HOUSE,,DUPLEX");
    expect(res.success && res.data.type).toEqual(["FLAT", "HOUSE", "DUPLEX"]);
  });

  it("accepts an already-array value as well as a string", () => {
    expect(propertyListQuerySchema.parse({ type: ["FLAT", "HOUSE"] }).type).toEqual(["FLAT", "HOUSE"]);
  });

  it("rejects the whole list when one member is not a known type", () => {
    expect(fromQuery("type=FLAT,CASTLE").success).toBe(false);
  });

  it("coerces numeric lists", () => {
    const res = fromQuery("beds=1,2,3&baths=2");
    expect(res.success && res.data.beds).toEqual([1, 2, 3]);
    expect(res.success && res.data.baths).toEqual([2]);
  });

  it("bounds bedroom and bathroom values", () => {
    expect(fromQuery("beds=21").success).toBe(false);
    expect(fromQuery("beds=-1").success).toBe(false);
    expect(fromQuery("beds=0").success).toBe(true);
  });

  it("caps an ids lookup at fifty", () => {
    // Stops /api/properties?ids=... being used to dump the table in one call.
    const fifty = Array.from({ length: 50 }, (_, i) => `id${i}`).join(",");
    expect(fromQuery(`ids=${fifty}`).success).toBe(true);
    expect(fromQuery(`ids=${fifty},id50`).success).toBe(false);
  });

  it("validates listingType against the enum", () => {
    expect(fromQuery("listingType=RENT,SALE").success).toBe(true);
    expect(fromQuery("listingType=BARTER").success).toBe(false);
  });

  it("validates furnishing against the enum", () => {
    expect(fromQuery("furnishing=UNFURNISHED,FULLY_FURNISHED").success).toBe(true);
    expect(fromQuery("furnishing=SORT_OF").success).toBe(false);
  });

  it("takes amenities as free-form strings", () => {
    const res = fromQuery("amenities=POOL,GYM");
    expect(res.success && res.data.amenities).toEqual(["POOL", "GYM"]);
  });
});

describe("propertyListQuerySchema — flags, prices and sorting", () => {
  it("turns the string booleans into real booleans", () => {
    expect(propertyListQuerySchema.parse({ verifiedOnly: "true" }).verifiedOnly).toBe(true);
    expect(propertyListQuerySchema.parse({ verifiedOnly: "false" }).verifiedOnly).toBe(false);
    expect(propertyListQuerySchema.parse({ availableNow: "true" }).availableNow).toBe(true);
  });

  it("rejects anything else in a boolean slot", () => {
    expect(propertyListQuerySchema.safeParse({ verifiedOnly: "1" }).success).toBe(false);
    expect(propertyListQuerySchema.safeParse({ verifiedOnly: "TRUE" }).success).toBe(false);
  });

  it("coerces price bounds and refuses negatives", () => {
    expect(propertyListQuerySchema.parse({ minPrice: "100000" }).minPrice).toBe(100000);
    expect(propertyListQuerySchema.safeParse({ minPrice: "-1" }).success).toBe(false);
  });

  it("accepts only the four sorts", () => {
    expect(propertyListQuerySchema.safeParse({ sort: "price_asc" }).success).toBe(true);
    expect(propertyListQuerySchema.safeParse({ sort: "rent DESC; DROP TABLE" }).success).toBe(false);
  });

  it("trims the free-text query", () => {
    expect(propertyListQuerySchema.parse({ q: "  duplex  " }).q).toBe("duplex");
  });

  it("accepts a map viewport bbox, including negative coordinates", () => {
    const res = fromQuery("minLng=-1.5&minLat=4&maxLng=8.2&maxLat=6");
    expect(res.success).toBe(true);
    expect(res.success && res.data.minLng).toBe(-1.5);
  });

  it("rejects a non-numeric bbox value", () => {
    expect(fromQuery("minLng=west").success).toBe(false);
  });
});

describe("featuredQuerySchema", () => {
  it("defaults to the latest eight", () => {
    expect(featuredQuerySchema.parse({})).toEqual({ type: "latest", limit: 8 });
  });

  it("accepts the four carousel types", () => {
    for (const type of ["latest", "hot", "virgin", "top"]) {
      expect(featuredQuerySchema.safeParse({ type }).success).toBe(true);
    }
    expect(featuredQuerySchema.safeParse({ type: "trending" }).success).toBe(false);
  });

  it("caps the limit at twenty", () => {
    expect(featuredQuerySchema.safeParse({ limit: "20" }).success).toBe(true);
    expect(featuredQuerySchema.safeParse({ limit: "21" }).success).toBe(false);
    expect(featuredQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
  });

  it("narrows by listing type and area", () => {
    const parsed = featuredQuerySchema.parse({ listingType: "RENT", area: "  Ewet Housing " });
    expect(parsed.listingType).toBe("RENT");
    expect(parsed.area).toBe("Ewet Housing");
  });
});
