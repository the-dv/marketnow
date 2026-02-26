import { describe, expect, it } from "vitest";
import { resolveSuggestedPrice } from "@/services/pricing-logic";

describe("resolveSuggestedPrice", () => {
  const regionContext = { country: "BR" as const, uf: "SP", macroRegion: "SE" as const };

  it("uses user's latest price first", () => {
    const result = resolveSuggestedPrice(
      [
        { paidPrice: 9.9, purchasedAt: "2026-02-20T10:00:00.000Z" },
        { paidPrice: 8.5, purchasedAt: "2026-01-10T10:00:00.000Z" },
      ],
      [{ regionType: "national", regionCode: "BR", avgPrice: 7.5, effectiveDate: "2026-01-01" }],
      regionContext,
    );

    expect(result.origin).toBe("user_last_price");
    expect(result.unitPrice).toBe(9.9);
    expect(result.isPriceAvailable).toBe(true);
  });

  it("falls back to user's average when latest user price is invalid", () => {
    const result = resolveSuggestedPrice(
      [
        { paidPrice: 6, purchasedAt: "2026-01-10T10:00:00.000Z" },
        { paidPrice: 8, purchasedAt: "2026-01-11T10:00:00.000Z" },
        { paidPrice: 0, purchasedAt: "2026-01-20T10:00:00.000Z" },
      ],
      [{ regionType: "national", regionCode: "BR", avgPrice: 10, effectiveDate: "2026-01-01" }],
      regionContext,
    );

    expect(result.origin).toBe("user_avg_price");
    expect(result.unitPrice).toBe(7);
  });

  it("uses seed by state when no user history", () => {
    const result = resolveSuggestedPrice(
      [],
      [
        { regionType: "state", regionCode: "SP", avgPrice: 12.3, effectiveDate: "2026-01-01" },
        { regionType: "national", regionCode: "BR", avgPrice: 10, effectiveDate: "2026-01-01" },
      ],
      regionContext,
    );

    expect(result.origin).toBe("seed_state");
    expect(result.unitPrice).toBe(12.3);
  });

  it("uses seed by macro region when state is absent", () => {
    const result = resolveSuggestedPrice(
      [],
      [
        { regionType: "macro_region", regionCode: "SE", avgPrice: 11.1, effectiveDate: "2026-01-01" },
        { regionType: "national", regionCode: "BR", avgPrice: 10, effectiveDate: "2026-01-01" },
      ],
      regionContext,
    );

    expect(result.origin).toBe("seed_macro_region");
    expect(result.unitPrice).toBe(11.1);
  });

  it("uses national seed when state and macro are absent", () => {
    const result = resolveSuggestedPrice(
      [],
      [{ regionType: "national", regionCode: "BR", avgPrice: 9.5, effectiveDate: "2026-01-01" }],
      { country: "BR" },
    );

    expect(result.origin).toBe("seed_national");
    expect(result.unitPrice).toBe(9.5);
  });

  it("returns unavailable when no source is found", () => {
    const result = resolveSuggestedPrice([], [], { country: "BR", uf: "SP", macroRegion: "SE" });

    expect(result.origin).toBe("unavailable");
    expect(result.unitPrice).toBe(0);
    expect(result.isPriceAvailable).toBe(false);
  });
});
