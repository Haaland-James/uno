import { getKindForPropertyType } from "../../config/constants";

const KIND_WORD = { RESIDENTIAL: "residential", COMMERCIAL: "commercial", LAND: "land" } as const;

/**
 * "commercial" / "land" / "residential" when the active type filter(s) all belong
 * to one kind, otherwise null (no filter, mixed kinds, or only unknown types).
 * Used so the result count names what was filtered to.
 */
export function describeKindContext(types: readonly string[]): string | null {
	const kinds = new Set<string>();
	for (const t of types) {
		const kind = getKindForPropertyType(t);
		if (kind) kinds.add(kind);
	}
	if (kinds.size !== 1) return null;
	return KIND_WORD[Array.from(kinds)[0] as keyof typeof KIND_WORD];
}

/**
 * The noun phrase of the results line: "9 commercial properties", "1 commercial
 * property", "20 latest properties". Callers put the count in front and
 * "listed for rent …" after.
 */
export function resultNoun(total: number, opts: { sortContext?: string | null; kindContext?: string | null } = {}): string {
	const words = [opts.sortContext?.toLowerCase(), opts.kindContext, total === 1 ? "property" : "properties"];
	return words.filter(Boolean).join(" ");
}
