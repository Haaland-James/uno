import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), findFirst: vi.fn(), update: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: mocks.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({ db: { savedSearch: { findFirst: mocks.findFirst, update: mocks.update } } }));
import { PATCH } from "../app/api/saved-searches/[id]/route";

const ctx = { params: { id: "s1" } };
const patch = (body: unknown) => new NextRequest("http://localhost/api/saved-searches/s1", { method: "PATCH", body: JSON.stringify(body) });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "renter" } });
  mocks.findFirst.mockResolvedValue({ id: "s1" });
  mocks.update.mockResolvedValue({ id: "s1", newResultsCount: 0 });
});

it("{ seen: true } clears the badge and sends no `seen` column to the database", async () => {
  expect((await PATCH(patch({ seen: true }), ctx)).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { newResultsCount: 0 } });
});

it("ordinary edits leave the badge alone", async () => {
  await PATCH(patch({ name: "Flats in Uyo" }), ctx);
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { name: "Flats in Uyo" } });
});

it("rejects { seen: false }", async () => {
  expect((await PATCH(patch({ seen: false }), ctx)).status).toBe(400);
  expect(mocks.update).not.toHaveBeenCalled();
});

it("only the owner can clear it", async () => {
  mocks.findFirst.mockResolvedValue(null);
  expect((await PATCH(patch({ seen: true }), ctx)).status).toBe(404);
  expect(mocks.findFirst).toHaveBeenCalledWith({ where: { id: "s1", userId: "renter" } });
});
