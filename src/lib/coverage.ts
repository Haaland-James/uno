/**
 * UNO geographic coverage — single source of truth for location autocomplete,
 * URL slug validation, and listing-wizard pickers.
 *
 * Hierarchy: state → city → area
 * Each node has `coveredInProduction` to gate prod visibility (dev shows everything).
 *
 * To expand into a new city/state, add nodes here and ship — no DB migration needed.
 * If a node grows large enough to warrant DB-backed admin editing, promote it then.
 */

export type LocationType = "state" | "city" | "area";

export interface LocationNode {
  /** URL-safe identifier — used in routes */
  slug: string;
  /** Display name */
  name: string;
  type: LocationType;
  /** Slug of parent node (state for cities, city for areas) */
  parent?: string;
  /** Bubble to top of dropdown when typing matches state */
  popular?: boolean;
  /** Alt spellings users might type ("AKS", "Akwa-Ibom") */
  aliases?: string[];
  /** When false, only visible in dev / staging */
  coveredInProduction: boolean;
}

/**
 * The coverage tree. Akwa Ibom is the launch market — fully covered in production.
 * Lagos, Abuja, etc. are dev-only fixtures so we have variety to test against.
 * To launch in a new state: flip its nodes' `coveredInProduction` to true.
 */
export const COVERAGE: LocationNode[] = [
  // ─── AKWA IBOM (launch market) ──────────────────────────────────
  { slug: "akwa-ibom", name: "Akwa Ibom", type: "state", popular: true, aliases: ["AKS", "Akwa-Ibom"], coveredInProduction: true },

  // Cities in Akwa Ibom
  { slug: "uyo", name: "Uyo", type: "city", parent: "akwa-ibom", popular: true, coveredInProduction: true },
  { slug: "eket", name: "Eket", type: "city", parent: "akwa-ibom", popular: true, coveredInProduction: true },
  { slug: "ikot-ekpene", name: "Ikot Ekpene", type: "city", parent: "akwa-ibom", coveredInProduction: true },
  { slug: "abak", name: "Abak", type: "city", parent: "akwa-ibom", coveredInProduction: true },
  { slug: "oron", name: "Oron", type: "city", parent: "akwa-ibom", coveredInProduction: true },

  // Popular Uyo areas (matches our seed data)
  { slug: "ewet-housing", name: "Ewet Housing", type: "area", parent: "uyo", popular: true, coveredInProduction: true },
  { slug: "shelter-afrique", name: "Shelter Afrique", type: "area", parent: "uyo", popular: true, coveredInProduction: true },
  { slug: "independence-layout", name: "Independence Layout", type: "area", parent: "uyo", popular: true, coveredInProduction: true },
  { slug: "ikpa-road", name: "Ikpa Road", type: "area", parent: "uyo", popular: true, coveredInProduction: true },
  { slug: "oron-road", name: "Oron Road", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "aka-road", name: "Aka Road", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "udo-udoma-avenue", name: "Udo Udoma Avenue", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "nwaniba-road", name: "Nwaniba Road", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "abak-road", name: "Abak Road", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "ring-road", name: "Ring Road", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "use-offot", name: "Use-Offot", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "itam", name: "Itam", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "aka-etinan-road", name: "Aka Etinan Road", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "ediene-abak-road", name: "Ediene Abak Road", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "uyo-village-road", name: "Uyo Village Road", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "ikot-ekpene-road", name: "Ikot Ekpene Road", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "uruan", name: "Uruan", type: "area", parent: "uyo", coveredInProduction: true },
  { slug: "four-lanes", name: "Four Lanes", type: "area", parent: "uyo", coveredInProduction: true },

  // Eket areas
  { slug: "marina-eket", name: "Marina", type: "area", parent: "eket", coveredInProduction: true },

  // ─── DEV-ONLY (fixtures only — flip coveredInProduction:true to launch) ──

  // Lagos
  { slug: "lagos", name: "Lagos", type: "state", popular: true, aliases: ["Lasgidi"], coveredInProduction: false },
  { slug: "lagos-city", name: "Lagos", type: "city", parent: "lagos", popular: true, coveredInProduction: false },
  { slug: "lekki-phase-1", name: "Lekki Phase 1", type: "area", parent: "lagos-city", popular: true, coveredInProduction: false },
  { slug: "lekki-phase-2", name: "Lekki Phase 2", type: "area", parent: "lagos-city", coveredInProduction: false },
  { slug: "lekki-county", name: "Lekki County", type: "area", parent: "lagos-city", coveredInProduction: false },
  { slug: "ikoyi", name: "Ikoyi", type: "area", parent: "lagos-city", popular: true, coveredInProduction: false },
  { slug: "victoria-island", name: "Victoria Island", type: "area", parent: "lagos-city", popular: true, aliases: ["VI"], coveredInProduction: false },
  { slug: "chevron-drive", name: "Chevron Drive", type: "area", parent: "lagos-city", coveredInProduction: false },
  { slug: "ikeja-gra", name: "Ikeja GRA", type: "area", parent: "lagos-city", coveredInProduction: false },
  { slug: "sangotedo", name: "Sangotedo", type: "area", parent: "lagos-city", coveredInProduction: false },

  // FCT / Abuja
  { slug: "fct", name: "FCT", type: "state", popular: true, aliases: ["Abuja", "Federal Capital Territory"], coveredInProduction: false },
  { slug: "abuja", name: "Abuja", type: "city", parent: "fct", popular: true, coveredInProduction: false },
  { slug: "wuse-2", name: "Wuse 2", type: "area", parent: "abuja", popular: true, coveredInProduction: false },
  { slug: "wuse-market", name: "Wuse Market", type: "area", parent: "abuja", coveredInProduction: false },
  { slug: "maitama", name: "Maitama", type: "area", parent: "abuja", popular: true, coveredInProduction: false },
  { slug: "asokoro", name: "Asokoro", type: "area", parent: "abuja", popular: true, coveredInProduction: false },
  { slug: "gwarinpa", name: "Gwarinpa", type: "area", parent: "abuja", coveredInProduction: false },
  { slug: "kado", name: "Kado", type: "area", parent: "abuja", coveredInProduction: false },
  { slug: "lugbe", name: "Lugbe", type: "area", parent: "abuja", coveredInProduction: false },

  // Rivers
  { slug: "rivers", name: "Rivers", type: "state", coveredInProduction: false },
  { slug: "port-harcourt", name: "Port Harcourt", type: "city", parent: "rivers", popular: true, aliases: ["PH", "PHC"], coveredInProduction: false },
  { slug: "gra-phase-2", name: "GRA Phase 2", type: "area", parent: "port-harcourt", coveredInProduction: false },
  { slug: "trans-amadi", name: "Trans Amadi", type: "area", parent: "port-harcourt", coveredInProduction: false },
  { slug: "trans-amadi-industrial", name: "Trans Amadi Industrial Layout", type: "area", parent: "port-harcourt", coveredInProduction: false },

  // Cross River
  { slug: "cross-river", name: "Cross River", type: "state", coveredInProduction: false },
  { slug: "calabar", name: "Calabar", type: "city", parent: "cross-river", popular: true, coveredInProduction: false },
  { slug: "state-housing-estate-calabar", name: "State Housing Estate", type: "area", parent: "calabar", coveredInProduction: false },
  { slug: "old-gra-calabar", name: "Old GRA", type: "area", parent: "calabar", coveredInProduction: false },
  { slug: "watt-market", name: "Watt Market", type: "area", parent: "calabar", coveredInProduction: false },
];

/** All Nigerian states we KNOW about but might not cover — used to recognize searches like "Lagos" even pre-launch */
export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara", "FCT",
];

// ─── Helpers ────────────────────────────────────────────────────────

const isProd = () => process.env.NODE_ENV === "production";

/** Returns the visible coverage list (filters out non-prod nodes when in production). */
export function visibleCoverage(): LocationNode[] {
  if (isProd()) return COVERAGE.filter((n) => n.coveredInProduction);
  return COVERAGE;
}

/** Look up a node by slug (visible only — respects prod gate). */
export function findBySlug(slug: string): LocationNode | undefined {
  return visibleCoverage().find((n) => n.slug === slug);
}

/** Look up a node by display name (case-insensitive, includes aliases). */
export function findByName(name: string): LocationNode | undefined {
  const q = name.trim().toLowerCase();
  return visibleCoverage().find(
    (n) =>
      n.name.toLowerCase() === q ||
      n.aliases?.some((a) => a.toLowerCase() === q)
  );
}

/** Return the children of a node (cities under a state, areas under a city). */
export function childrenOf(parentSlug: string): LocationNode[] {
  return visibleCoverage().filter((n) => n.parent === parentSlug);
}

/** Walk up from a node to its state (returns null if not found). */
export function stateOf(slug: string): LocationNode | null {
  const node = findBySlug(slug);
  if (!node) return null;
  if (node.type === "state") return node;
  if (node.type === "city" && node.parent) return findBySlug(node.parent) ?? null;
  if (node.type === "area" && node.parent) {
    const city = findBySlug(node.parent);
    if (city?.parent) return findBySlug(city.parent) ?? null;
  }
  return null;
}

/**
 * The autocomplete brain. Given a query string, return what the dropdown should show.
 *
 * Returns one of:
 *   { kind: "matches", groups: [...] }       — covered matches grouped by hierarchy
 *   { kind: "uncovered", name: "Lagos" }     — recognized NG location we don't cover
 *   { kind: "no_match" }                      — nothing matched at all
 *   { kind: "popular" }                       — empty query — show popular picks
 */
export type AutocompleteResult =
  | { kind: "popular"; nodes: LocationNode[] }
  | { kind: "matches"; nodes: LocationNode[]; expansions: { node: LocationNode; children: LocationNode[] }[] }
  | { kind: "uncovered"; name: string }
  | { kind: "no_match" };

export function searchCoverage(rawQuery: string): AutocompleteResult {
  const q = rawQuery.trim().toLowerCase();
  if (!q) {
    return { kind: "popular", nodes: visibleCoverage().filter((n) => n.popular) };
  }

  const visible = visibleCoverage();
  const matches: LocationNode[] = [];
  for (const n of visible) {
    const haystack = [n.name, ...(n.aliases ?? [])].map((s) => s.toLowerCase());
    if (haystack.some((s) => s.startsWith(q) || s.includes(q))) matches.push(n);
  }

  if (matches.length > 0) {
    // Sort: exact match > popular > rest. Then by type weight: state > city > area.
    const typeWeight = { state: 0, city: 1, area: 2 } as const;
    matches.sort((a, b) => {
      const aExact = a.name.toLowerCase() === q ? 0 : 1;
      const bExact = b.name.toLowerCase() === q ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aPop = a.popular ? 0 : 1;
      const bPop = b.popular ? 0 : 1;
      if (aPop !== bPop) return aPop - bPop;
      return typeWeight[a.type] - typeWeight[b.type];
    });

    // For state matches, expand to show top children
    const expansions = matches
      .filter((n) => n.type === "state")
      .slice(0, 1)
      .map((stateNode) => ({
        node: stateNode,
        children: childrenOf(stateNode.slug)
          .sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0))
          .slice(0, 6),
      }));

    return { kind: "matches", nodes: matches.slice(0, 8), expansions };
  }

  // No covered matches — see if it's a known NG state we don't cover
  const stateMatch = NIGERIAN_STATES.find((s) => s.toLowerCase().startsWith(q));
  if (stateMatch) return { kind: "uncovered", name: stateMatch };

  return { kind: "no_match" };
}
