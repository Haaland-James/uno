import { isCanonicalArea, NIGERIAN_STATES } from "@/../config/constants";

/**
 * Property doesn't carry `state`, only `lga` + `area`. Treat the area as canonical
 * if ANY state's coverage entry for this LGA contains it. (LGA names are roughly
 * unique enough across states for this to work — when collisions happen, the
 * worst case is a false negative, i.e. we surface it for review unnecessarily.)
 *
 * Centralised here so both the admin queue endpoint and the dashboard count
 * pending-area listings the same way.
 */
export function isAnyCanonicalLgaArea(
	lga: string | null | undefined,
	area: string | null | undefined
): boolean {
	if (!lga || !area) return false;
	return NIGERIAN_STATES.some((s) => isCanonicalArea(s, lga, area));
}
