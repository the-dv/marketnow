import { describe, expect, it } from "vitest";
import {
  extractDigits,
  formatBrlFromDigits,
  formatBrlFromNumber,
  isBlockedNumericKey,
  normalizeQuantityInput,
  parseBrlToNumber,
} from "@/services/input-format";

describe("input-format helpers", () => {
  it("extractDigits keeps only numbers", () => {
    expect(extractDigits("R$ 12,34 abc")).toBe("1234");
  });

  it("formatBrlFromDigits formats as BRL", () => {
    expect(formatBrlFromDigits("1234")).toContain("12,34");
  });

  it("formatBrlFromNumber formats numeric values", () => {
    expect(formatBrlFromNumber(10)).toContain("10,00");
    expect(formatBrlFromNumber(null)).toBe("");
  });

  it("parseBrlToNumber parses masked value back to numeric", () => {
    expect(parseBrlToNumber("R$ 12,34")).toBe(12.34);
    expect(parseBrlToNumber("")).toBeNull();
  });

  it("normalizeQuantityInput removes invalid chars and keeps max 3 decimals", () => {
    expect(normalizeQuantityInput("12a,34567")).toBe("12.345");
    expect(normalizeQuantityInput("@@3.1.2")).toBe("3.12");
  });

  it("isBlockedNumericKey blocks scientific and symbol chars", () => {
    expect(isBlockedNumericKey("e")).toBe(true);
    expect(isBlockedNumericKey("@")).toBe(true);
    expect(isBlockedNumericKey("1")).toBe(false);
  });
});
