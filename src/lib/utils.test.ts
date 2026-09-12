import { describe, expect, it } from "vitest";

import { clampQuantity, cn, formatCurrency, percentageOff } from "./utils";

describe("cn", () => {
  it("joins truthy class names with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("formatCurrency", () => {
  it("formats a whole number as Colombian pesos, no decimals", () => {
    // Intl inserts a non-breaking space between symbol and amount in es-CO.
    expect(formatCurrency(149900).replace(/\s/g, " ")).toBe("$ 149.900");
  });

  it("supports a different currency code", () => {
    expect(formatCurrency(10, "USD")).toContain("10");
  });
});

describe("percentageOff", () => {
  it("returns null when there is no compareAtPrice", () => {
    expect(percentageOff(100)).toBeNull();
  });

  it("returns null when compareAtPrice is not actually higher", () => {
    expect(percentageOff(100, 100)).toBeNull();
    expect(percentageOff(100, 80)).toBeNull();
  });

  it("computes and rounds the discount percentage", () => {
    expect(percentageOff(149900, 189900)).toBe(21);
  });
});

describe("clampQuantity", () => {
  it("floors decimal quantities", () => {
    expect(clampQuantity(3.7)).toBe(3);
  });

  it("clamps to 1 for anything less than 1", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-5)).toBe(1);
  });

  it("clamps NaN to 1 instead of propagating it into the cart", () => {
    expect(clampQuantity(Number.NaN)).toBe(1);
  });
});
