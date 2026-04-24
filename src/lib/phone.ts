/**
 * Normalize a phone number to E.164 format.
 * Defaults to Nigeria (+234) if no country code is given.
 *
 * Examples:
 *   "08012345678"      → "+2348012345678"
 *   "8012345678"       → "+2348012345678"
 *   "2348012345678"    → "+2348012345678"
 *   "+2348012345678"   → "+2348012345678"
 *   "+1 555 123 4567"  → "+15551234567"
 */
export function normalizePhone(input: string, defaultCountryCode = "234"): string | null {
  if (!input) return null;

  // Strip spaces, dashes, parens
  const digits = input.replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) {
    // Already in E.164 form (we trust the +)
    return digits.length >= 8 ? digits : null;
  }

  // Pure digits — apply country logic
  let n = digits;

  // 0-prefixed local NG number (e.g. "08012345678")
  if (defaultCountryCode === "234" && n.startsWith("0")) {
    n = n.slice(1);
  }

  // Already starts with country code (no +)
  if (n.startsWith(defaultCountryCode)) {
    return `+${n}`;
  }

  return `+${defaultCountryCode}${n}`;
}

export function isValidPhone(input: string): boolean {
  const norm = normalizePhone(input);
  return !!norm && /^\+\d{8,15}$/.test(norm);
}
