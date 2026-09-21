import { describe, expect, it } from "vitest";
import { toDetailDto } from "./property-mappers";
import { formatResponseTime } from "./response-metrics-format";

const property = {
  id: "property", photos: [], amenities: [], createdAt: new Date(), updatedAt: new Date(),
  landlord: { id: "owner", name: "Owner", landlordProfile: { responseRate: 75, avgResponseTime: 180 } },
  contactCount: 999,
} as unknown as Parameters<typeof toDetailDto>[0];

describe("response metrics presentation", () => {
  it.each([undefined, 0, 1, 2])("suppresses insufficient real samples (%s), ignoring contactCount", (sampleSize) => {
    const responseMetrics = sampleSize === undefined ? undefined : { sampleSize, responseRate: 50, avgResponseTime: 120 };
    const dto = toDetailDto(property, false, { responseMetrics });
    expect(dto.listedBy).toMatchObject({ responseRate: null, avgResponseTime: null });
  });
  it("surfaces source metrics at three enquiries, never stale profile values", () => {
    expect(toDetailDto(property, false, { responseMetrics: { sampleSize: 3, responseRate: 50, avgResponseTime: 120 } }).listedBy)
      .toMatchObject({ responseRate: 50, avgResponseTime: 120 });
  });
  it("suppresses agent metrics even with a large sample", () => {
    expect(toDetailDto({ ...property, listedByAgent: true }, false, { responseMetrics: { sampleSize: 100, responseRate: 50, avgResponseTime: 120 } }).listedBy)
      .toMatchObject({ responseRate: null, avgResponseTime: null });
  });
  it("surfaces source metrics even without a profile", () => {
    expect(toDetailDto({ ...property, landlord: { ...property.landlord, landlordProfile: null } }, false, { responseMetrics: { sampleSize: 3, responseRate: 50, avgResponseTime: 120 } }).listedBy)
      .toMatchObject({ responseRate: 50, avgResponseTime: 120 });
  });
  it.each([[0, "under an hour"], [59, "under an hour"], [60, "about 1 hour"], [180, "about 3 hours"], [720, "within a day"], [1440, "about 1 day"], [2880, "about 2 days"]])("formats %s minutes", (minutes, text) => {
    expect(formatResponseTime(minutes as number)).toBe(text);
  });
});
