import { describe, it, expect } from "vitest";
import { formatMoney } from "./money.js";
describe("formatMoney", () => {
  it("formats paise as INR", () =>
    expect(formatMoney(12345)).toContain("123.45"));
  it("formats zero with two decimals", () =>
    expect(formatMoney(0)).toBe("₹0.00"));
  it("formats a single paise", () =>
    expect(formatMoney(1)).toBe("₹0.01"));
  it("converts paise to whole rupees", () =>
    expect(formatMoney(100)).toBe("₹1.00"));
  it("formats a negative balance with a minus sign", () =>
    expect(formatMoney(-5000)).toBe("-₹50.00"));
  it("uses Indian digit grouping", () =>
    expect(formatMoney(100000000)).toBe("₹10,00,000.00"));
  it("never emits more than two decimal places", () => {
    for (const paise of [0, 1, 7, 99, 12345, 999999])
      expect(formatMoney(paise)).toMatch(/₹[\d,]+\.\d{2}$/);
  });
});
