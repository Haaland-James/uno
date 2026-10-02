/**
 * Text handling for whole-naira inputs (MoneyInput, FeeInput).
 *
 * Prices are whole naira, so a decimal point and everything after it is ignored:
 * "5,000,000,000.00" is 5,000,000,000 (it used to become 500,000,000,000 because
 * every non-digit, including the point, was stripped and the cents were kept).
 *
 * Typing is the harder case. The inputs are controlled, so when someone types ".",
 * the field would re-render from the number and the point would vanish, and the
 * next digits would be appended as whole digits. To avoid that, the digits typed
 * after the point are kept as display-only text (`decimals`) next to the number:
 * the person sees what they typed, the value ignores it, and it is cleared on blur.
 */

/** The whole-naira value in `raw`: commas, spaces and a leading ₦ are stripped; the first "." and everything after it are ignored. */
export function parseWholeNumber(raw: string): number | null {
	const digits = raw.split(".")[0].replace(/[^\d]/g, "");
	if (!digits) return null;
	return Number(digits);
}

export type WholeNumberText = {
	value: number | null;
	/** Digits typed after a decimal point (display only, at most 2), or null when there is no point. */
	decimals: string | null;
};

/** Read what the person typed or pasted. */
export function readWholeNumberText(raw: string): WholeNumberText {
	const dot = raw.indexOf(".");
	return {
		value: parseWholeNumber(raw),
		decimals: dot === -1 ? null : raw.slice(dot + 1).replace(/[^\d]/g, "").slice(0, 2),
	};
}

/** What to show in the field for a value plus any decimals the person is typing. */
export function showWholeNumberText(formatted: string, decimals: string | null): string {
	return decimals === null ? formatted : `${formatted || "0"}.${decimals}`;
}
