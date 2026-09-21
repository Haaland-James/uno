import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findMany: vi.fn(), updateMany: vi.fn() }));
vi.mock("@prisma/client", () => ({ PrismaClient: class { property = mocks; } }));
import { main } from "../../scripts/backfill-titles";
it("dry run prints old → new for live rows without any writes", async () => {
  const row = { id: "outlier", title: "Ekpiri Nsukarra Self Contain", propertyKind: "RESIDENTIAL", propertyType: "WAREHOUSE", listingType: "SALE", bedrooms: 0, area: "Ekpiri Nsukarra", city: "Uyo", updatedAt: new Date() };
  mocks.findMany.mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  try {
    await main(["--dry-run"]);
    expect(mocks.findMany.mock.calls[0][0].where).toEqual({ deletedAt: null });
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(log.mock.calls.flat().join("\n")).toContain('Warehouse for Sale in Ekpiri Nsukarra, Uyo');
    expect(log.mock.calls.flat().join("\n")).toContain('Ekpiri Nsukarra Self Contain');
  } finally { log.mockRestore(); }
});
it("rejects misspelled flags before reading or writing", async () => {
  mocks.findMany.mockClear();
  await expect(main(["--dryrun"])).rejects.toThrow("Usage");
  expect(mocks.findMany).not.toHaveBeenCalled();
});