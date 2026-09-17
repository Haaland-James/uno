import { describe, it, expect, afterEach, vi } from "vitest";
import {
  COVERAGE,
  NIGERIAN_STATES,
  visibleCoverage,
  findBySlug,
  findByName,
  childrenOf,
  stateOf,
  searchCoverage,
} from "./coverage";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("COVERAGE tree integrity", () => {
  it("has no duplicate slugs", () => {
    const slugs = COVERAGE.map((n) => n.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every non-state node points at a parent that exists", () => {
    const slugs = new Set(COVERAGE.map((n) => n.slug));
    for (const n of COVERAGE) {
      if (n.type === "state") continue;
      expect(n.parent, `${n.slug} has no parent`).toBeDefined();
      expect(slugs.has(n.parent!), `${n.slug} points at missing parent ${n.parent}`).toBe(true);
    }
  });

  it("cities hang off states and areas hang off cities", () => {
    const bySlug = new Map(COVERAGE.map((n) => [n.slug, n]));
    for (const n of COVERAGE) {
      if (n.type === "city") expect(bySlug.get(n.parent!)?.type).toBe("state");
      if (n.type === "area") expect(bySlug.get(n.parent!)?.type).toBe("city");
    }
  });

  it("no production-visible node depends on a dev-only parent", () => {
    // A prod-visible area whose city is dev-only would resolve to a broken URL
    // in production, because findBySlug(parent) returns undefined there.
    const bySlug = new Map(COVERAGE.map((n) => [n.slug, n]));
    for (const n of COVERAGE) {
      if (!n.coveredInProduction || !n.parent) continue;
      expect(
        bySlug.get(n.parent)?.coveredInProduction,
        `${n.slug} is prod-visible but its parent ${n.parent} is not`
      ).toBe(true);
    }
  });

  it("every state node names a real Nigerian state", () => {
    for (const n of COVERAGE) {
      if (n.type !== "state") continue;
      expect(NIGERIAN_STATES).toContain(n.name);
    }
  });
});

describe("visibleCoverage", () => {
  it("shows the whole tree outside production", () => {
    expect(visibleCoverage()).toHaveLength(COVERAGE.length);
    expect(visibleCoverage().some((n) => n.slug === "lagos")).toBe(true);
  });

  it("hides dev-only nodes in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const visible = visibleCoverage();
    expect(visible.every((n) => n.coveredInProduction)).toBe(true);
    expect(visible.some((n) => n.slug === "akwa-ibom")).toBe(true);
    expect(visible.some((n) => n.slug === "lagos")).toBe(false);
  });
});

describe("findBySlug", () => {
  it("finds a node by slug", () => {
    expect(findBySlug("uyo")).toMatchObject({ name: "Uyo", type: "city", parent: "akwa-ibom" });
  });

  it("returns undefined for an unknown slug", () => {
    expect(findBySlug("atlantis")).toBeUndefined();
  });

  it("respects the production gate", () => {
    expect(findBySlug("lekki-phase-1")).toBeDefined();
    vi.stubEnv("NODE_ENV", "production");
    expect(findBySlug("lekki-phase-1")).toBeUndefined();
  });
});

describe("findByName", () => {
  it("matches case-insensitively and ignores surrounding whitespace", () => {
    expect(findByName("uyo")?.slug).toBe("uyo");
    expect(findByName("UYO")?.slug).toBe("uyo");
    expect(findByName("  Uyo  ")?.slug).toBe("uyo");
  });

  it("matches declared aliases", () => {
    expect(findByName("AKS")?.slug).toBe("akwa-ibom");
    expect(findByName("Akwa-Ibom")?.slug).toBe("akwa-ibom");
    expect(findByName("VI")?.slug).toBe("victoria-island");
    expect(findByName("PH")?.slug).toBe("port-harcourt");
  });

  it("returns undefined when nothing matches", () => {
    expect(findByName("Narnia")).toBeUndefined();
  });

  it("requires a whole-name match, not a prefix", () => {
    expect(findByName("Uy")).toBeUndefined();
  });
});

describe("childrenOf", () => {
  it("returns the cities under a state", () => {
    const cities = childrenOf("akwa-ibom");
    expect(cities.map((c) => c.slug).sort()).toEqual(
      ["abak", "eket", "ikot-ekpene", "oron", "uyo"].sort()
    );
    expect(cities.every((c) => c.type === "city")).toBe(true);
  });

  it("returns the areas under a city", () => {
    const areas = childrenOf("uyo");
    expect(areas.length).toBeGreaterThan(0);
    expect(areas.every((a) => a.type === "area")).toBe(true);
    expect(areas.map((a) => a.slug)).toContain("ewet-housing");
  });

  it("returns an empty list for a leaf or unknown node", () => {
    expect(childrenOf("ewet-housing")).toEqual([]);
    expect(childrenOf("nowhere")).toEqual([]);
  });
});

describe("stateOf", () => {
  it("returns a state node as itself", () => {
    expect(stateOf("akwa-ibom")?.slug).toBe("akwa-ibom");
  });

  it("walks a city up to its state", () => {
    expect(stateOf("uyo")?.slug).toBe("akwa-ibom");
  });

  it("walks an area up two levels to its state", () => {
    expect(stateOf("ewet-housing")?.slug).toBe("akwa-ibom");
    expect(stateOf("marina-eket")?.slug).toBe("akwa-ibom");
  });

  it("returns null for an unknown slug", () => {
    expect(stateOf("atlantis")).toBeNull();
  });
});

describe("searchCoverage", () => {
  it("returns popular picks for an empty or whitespace query", () => {
    for (const q of ["", "   "]) {
      const res = searchCoverage(q);
      expect(res.kind).toBe("popular");
      if (res.kind === "popular") {
        expect(res.nodes.length).toBeGreaterThan(0);
        expect(res.nodes.every((n) => n.popular)).toBe(true);
      }
    }
  });

  it("ranks an exact name match first", () => {
    const res = searchCoverage("uyo");
    expect(res.kind).toBe("matches");
    if (res.kind === "matches") {
      expect(res.nodes[0].slug).toBe("uyo");
      // "Uyo Village Road" also starts with the query, so it should appear in
      // the list but rank below the exact hit.
      expect(res.nodes.map((n) => n.slug)).toContain("uyo-village-road");
    }
  });

  it("matches on a substring, not only a prefix", () => {
    const res = searchCoverage("housing");
    expect(res.kind).toBe("matches");
    if (res.kind === "matches") {
      expect(res.nodes.map((n) => n.slug)).toContain("ewet-housing");
    }
  });

  it("matches aliases", () => {
    const res = searchCoverage("aks");
    expect(res.kind).toBe("matches");
    if (res.kind === "matches") expect(res.nodes[0].slug).toBe("akwa-ibom");
  });

  it("expands a matched state with up to six children, popular first", () => {
    const res = searchCoverage("akwa");
    expect(res.kind).toBe("matches");
    if (res.kind === "matches") {
      expect(res.expansions).toHaveLength(1);
      const exp = res.expansions[0];
      expect(exp.node.slug).toBe("akwa-ibom");
      expect(exp.children.length).toBeLessThanOrEqual(6);
      expect(exp.children[0].popular).toBe(true);
    }
  });

  it("does not expand when no state matched", () => {
    const res = searchCoverage("ewet");
    expect(res.kind).toBe("matches");
    if (res.kind === "matches") expect(res.expansions).toEqual([]);
  });

  it("caps the match list at eight", () => {
    const res = searchCoverage("road");
    expect(res.kind).toBe("matches");
    if (res.kind === "matches") expect(res.nodes.length).toBeLessThanOrEqual(8);
  });

  it("reports a known Nigerian state we do not cover", () => {
    expect(searchCoverage("kano")).toEqual({ kind: "uncovered", name: "Kano" });
  });

  it("reports no_match for gibberish", () => {
    expect(searchCoverage("zzzzqq")).toEqual({ kind: "no_match" });
  });

  it("prefers a covered match over the uncovered-state fallback", () => {
    // "Rivers" is both a COVERAGE node (dev-only) and a NIGERIAN_STATES entry.
    // Outside production the covered node must win.
    expect(searchCoverage("rivers").kind).toBe("matches");
  });

  it("falls back to uncovered for a dev-only state once in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(searchCoverage("lagos")).toEqual({ kind: "uncovered", name: "Lagos" });
  });
});
