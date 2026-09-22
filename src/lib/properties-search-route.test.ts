import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: async () => null }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: mocks.queryRaw,
    property: { findMany: mocks.findMany, count: mocks.count },
  },
}));

import { GET } from "../app/api/properties/route";

beforeEach(() => {
  vi.resetAllMocks();
});

it("narrows ranked-search candidate filtering to the FTS result IDs", async () => {
  mocks.queryRaw.mockResolvedValueOnce([
    { id: "ranked-a", rank: 0.9 },
    { id: "ranked-b", rank: 0.8 },
  ]);
  mocks.findMany
    .mockResolvedValueOnce([{ id: "ranked-a" }, { id: "ranked-b" }])
    .mockResolvedValueOnce([]);

  const response = await GET(new NextRequest("http://localhost/api/properties?q=flat&city=Uyo"));

  expect(response.status).toBe(200);
  expect(mocks.findMany).toHaveBeenNthCalledWith(1, {
    where: expect.objectContaining({
      status: "ACTIVE",
      deletedAt: null,
      city: { equals: "Uyo", mode: "insensitive" },
      id: { in: ["ranked-a", "ranked-b"] },
    }),
    select: { id: true },
  });
  expect(mocks.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
    where: expect.objectContaining({ id: { in: ["ranked-a", "ranked-b"] } }),
  }));
  expect(mocks.count).not.toHaveBeenCalled();
});

it("intersects an explicit ids filter with FTS results instead of replacing it", async () => {
  mocks.queryRaw.mockResolvedValueOnce([
    { id: "requested-a", rank: 0.9 },
    { id: "outside-request", rank: 0.8 },
  ]);
  mocks.findMany
    .mockResolvedValueOnce([{ id: "requested-a" }])
    .mockResolvedValueOnce([]);

  const response = await GET(new NextRequest("http://localhost/api/properties?q=flat&ids=requested-a,requested-b"));

  expect(response.status).toBe(200);
  expect(mocks.findMany).toHaveBeenNthCalledWith(1, {
    where: expect.objectContaining({
      status: "ACTIVE",
      deletedAt: null,
      id: { in: ["requested-a"] },
    }),
    select: { id: true },
  });
  expect(mocks.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
    where: expect.objectContaining({ id: { in: ["requested-a"] } }),
  }));
});
