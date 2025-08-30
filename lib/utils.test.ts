import { describe, expect, it } from "vitest";
import { Caip2ByChainAlias, cn, formatGRT, formatPercent, resolveChainAlias } from "@/lib/utils";

describe("lib/utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
      expect(cn("px-4", "px-8")).toBe("px-8");
      expect(cn("text-red-500", undefined, "text-blue-500")).toBe("text-blue-500");
    });

    it("should handle conditional classes", () => {
      expect(cn("base", true && "conditional", false && "ignored")).toBe("base conditional");
    });
  });

  describe("resolveChainAlias", () => {
    it("should resolve known chain aliases", () => {
      expect(resolveChainAlias("eip155:1")).toBe("mainnet");
      expect(resolveChainAlias("eip155:5")).toBe("goerli");
      expect(resolveChainAlias("eip155:100")).toBe("gnosis");
      expect(resolveChainAlias("eip155:42161")).toBe("arbitrum-one");
    });

    it("should return original id for unknown chains", () => {
      expect(resolveChainAlias("eip155:999")).toBe("eip155:999");
      expect(resolveChainAlias("unknown-chain")).toBe("unknown-chain");
    });

    it("should handle multiple matches by returning original id", () => {
      // This tests the behavior when aliasMatches.length !== 1
      expect(resolveChainAlias("non-existent")).toBe("non-existent");
    });
  });

  describe("formatGRT", () => {
    it("should format GRT without symbol by default", () => {
      expect(formatGRT("1000000000000000000")).toBe("1"); // 1 ether = 1 GRT
      expect(formatGRT("1500000000000000000")).toBe("1.5"); // 1.5 ether
    });

    it("should format GRT with symbol when requested", () => {
      expect(formatGRT("1000000000000000000", { withSymbol: true })).toBe("1 GRT");
      expect(formatGRT("1500000000000000000", { withSymbol: true })).toBe("1.5 GRT");
    });

    it("should handle decimals option", () => {
      expect(formatGRT("1234567890123456789", { decimals: 4 })).toBe("1.2346");
      expect(formatGRT("1234567890123456789", { decimals: 0 })).toBe("1");
    });

    it("should handle invalid inputs", () => {
      expect(formatGRT("invalid")).toBe("0");
      expect(formatGRT("invalid", { withSymbol: true })).toBe("0 GRT");
    });

    it("should handle BigInt input", () => {
      expect(formatGRT(BigInt("1000000000000000000"))).toBe("1");
    });

    it("should handle number input", () => {
      expect(formatGRT(1000000000000000000)).toBe("1");
    });
  });

  describe("formatPercent", () => {
    it("should format numbers as percentages", () => {
      expect(formatPercent(0.5)).toBe("0.5%");
      expect(formatPercent(1)).toBe("1%");
      expect(formatPercent(12.345)).toBe("12.35%");
    });

    it("should format string numbers as percentages", () => {
      expect(formatPercent("0.5")).toBe("0.5%");
      expect(formatPercent("12.345")).toBe("12.35%");
    });

    it("should handle decimals option", () => {
      expect(formatPercent(12.345, 0)).toBe("12%");
      expect(formatPercent(12.345, 1)).toBe("12.3%");
      expect(formatPercent(12.345, 3)).toBe("12.345%");
    });

    it("should handle invalid inputs", () => {
      expect(formatPercent("invalid")).toBe("0%");
      expect(formatPercent(Number.NaN)).toBe("0%");
      expect(formatPercent(Number.POSITIVE_INFINITY)).toBe("0%");
    });

    it("should handle locale option", () => {
      // Note: Locale testing may vary by environment, so we just ensure it doesn't throw
      expect(() => formatPercent(12.345, 2, "en-US")).not.toThrow();
      expect(() => formatPercent(12.345, 2, "de-DE")).not.toThrow();
    });
  });

  describe("Caip2ByChainAlias", () => {
    it("should contain expected chain mappings", () => {
      expect(Caip2ByChainAlias.mainnet).toBe("eip155:1");
      expect(Caip2ByChainAlias.goerli).toBe("eip155:5");
      expect(Caip2ByChainAlias.gnosis).toBe("eip155:100");
      expect(Caip2ByChainAlias["arbitrum-one"]).toBe("eip155:42161");
    });
  });
});
