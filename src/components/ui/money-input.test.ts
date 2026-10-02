import { describe, expect, it } from "vitest";
import { parseInput } from "./MoneyInput";
import { readWholeNumberText, showWholeNumberText, type WholeNumberText } from "./whole-number-text";

const group = (n: number | null) => (n === null ? "" : n.toLocaleString("en-NG"));

describe("MoneyInput.parseInput: prices are whole naira", () => {
  it.each([
    ["5,000,000,000.00", 5_000_000_000], // was 500,000,000,000
    ["2,500,000.50", 2_500_000],
    ["2500000.5", 2_500_000],
    ["350000.", 350_000],
    ["12.99", 12],
  ])("pasted: ignores everything from the decimal point: %s", (raw, expected) => {
    expect(parseInput(raw)).toBe(expected);
  });

  it.each([
    ["5,000,000", 5_000_000],
    ["₦5,000,000", 5_000_000],
    ["₦ 5 000 000", 5_000_000],
    ["  350000 ", 350_000],
    ["0", 0],
    ["007", 7],
  ])("still strips commas, spaces and a leading ₦: %s", (raw, expected) => {
    expect(parseInput(raw)).toBe(expected);
  });

  it.each([[""], ["abc"], ["₦"], ["."], [".50"], [",,,"]])("%j is empty", (raw) => {
    expect(parseInput(raw)).toBeNull();
  });
});

describe("typing one character at a time (the field re-renders from the number after every keystroke)", () => {
  /** Simulates the controlled input: what's on screen plus the next key press becomes the next raw text. */
  const type = (keys: string, start: WholeNumberText = { value: null, decimals: null }) => {
    let state = start;
    for (const key of keys) {
      const raw = showWholeNumberText(group(state.value), state.decimals) + key;
      state = readWholeNumberText(raw);
    }
    return { state, shown: showWholeNumberText(group(state.value), state.decimals) };
  };

  it("5,000,000,000.00 stays 5,000,000,000 (it was 500,000,000,000)", () => {
    const { state, shown } = type("5000000000.00");
    expect(state.value).toBe(5_000_000_000);
    expect(shown).toBe("5,000,000,000.00"); // what they typed stays visible until they leave the field
  });

  it("2,500,000.50 stays 2,500,000", () => {
    expect(type("2500000.50").state.value).toBe(2_500_000);
  });

  it("digits typed after the point never reach the value, however many", () => {
    expect(type("1500000.123456").state.value).toBe(1_500_000);
    expect(type("1500000.123456").state.decimals).toBe("12"); // capped for display
  });

  it("a plain whole number types as before", () => {
    const { state, shown } = type("350000");
    expect(state.value).toBe(350_000);
    expect(shown).toBe("350,000");
  });

  it("a leading point starts from zero and the digits after it are still ignored", () => {
    const { state, shown } = type(".5");
    expect(state.value).toBe(0); // "0.5" on screen; a price of 0 is then refused as not above zero
    expect(shown).toBe("0.5");
  });

  it("deleting the point makes the typed digits part of the number again (that's their edit)", () => {
    const typed = type("100.5");
    const raw = "1005"; // user selects and removes the "."
    expect(readWholeNumberText(raw)).toEqual({ value: 1005, decimals: null });
    expect(typed.state.value).toBe(100);
  });

  it("leaving the field drops the typed decimals, leaving the whole number", () => {
    const { state } = type("2500000.75");
    const afterBlur = { ...state, decimals: null }; // MoneyInput/FeeInput clear `decimals` on blur
    expect(showWholeNumberText(group(afterBlur.value), afterBlur.decimals)).toBe("2,500,000");
  });
});
