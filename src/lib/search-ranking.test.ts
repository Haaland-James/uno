import { describe, it, expect } from "vitest";
import { pageRankedIds, reorderByIds } from "./search-ranking";

describe("pageRankedIds", () => {
  const ranked = ["a", "b", "c", "d", "e", "f"];
  const matching = new Set(["f", "d", "a", "c", "outside"]);

  it("preserves rank order after filtering", () => {
    expect(pageRankedIds(ranked, matching, 0, 10).pageIds).toEqual(["a", "c", "d", "f"]);
  });

  it("returns disjoint consecutive pages whose union is the full ranked filtered set", () => {
    const first = pageRankedIds(ranked, matching, 0, 2);
    const second = pageRankedIds(ranked, matching, 2, 2);
    expect(first.pageIds).toEqual(["a", "c"]);
    expect(second.pageIds).toEqual(["d", "f"]);
    expect(first.pageIds.filter((id) => second.pageIds.includes(id))).toEqual([]);
    const all = [...first.pageIds, ...second.pageIds];
    expect(all).toEqual(["a", "c", "d", "f"]);
    expect(new Set(all).size).toBe(first.total);
  });

  it("counts filtered matches rather than all ranked IDs", () => {
    expect(pageRankedIds(ranked, matching, 0, 2).total).toBe(4);
  });

  it("returns an empty page past the end while retaining the total", () => {
    expect(pageRankedIds(ranked, matching, 20, 2)).toEqual({ pageIds: [], total: 4 });
  });

  it("ignores matching IDs absent from the rank list", () => {
    expect(pageRankedIds(["a"], ["outside"], 0, 2)).toEqual({ pageIds: [], total: 0 });
  });
});

describe("reorderByIds", () => {
  it("restores the requested order and drops IDs with no row", () => {
    const a = { id: "a", title: "First" };
    const b = { id: "b", title: "Second" };
    expect(reorderByIds([b, a], ["a", "missing", "b"])).toEqual([a, b]);
  });
});
