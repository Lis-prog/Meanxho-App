import { describe, expect, it } from "vitest";
import { formatMinor, parseAmountToMinor } from "@/lib/money";

describe("parseAmountToMinor", () => {
  it("accepts dot and comma decimals", () => {
    expect(parseAmountToMinor("4.50", "EUR")).toBe(450);
    expect(parseAmountToMinor("4,50", "EUR")).toBe(450);
    expect(parseAmountToMinor("4", "EUR")).toBe(400);
    expect(parseAmountToMinor("1.2", "EUR")).toBe(120);
    expect(parseAmountToMinor(" 12 ", "EUR")).toBe(1_200);
  });

  it("rejects empty, zero, negative, and extra decimals", () => {
    expect(parseAmountToMinor("", "EUR")).toBeNull();
    expect(parseAmountToMinor("0", "EUR")).toBeNull();
    expect(parseAmountToMinor("0.00", "EUR")).toBeNull();
    expect(parseAmountToMinor("-1", "EUR")).toBeNull();
    expect(parseAmountToMinor("1.234", "EUR")).toBeNull();
    expect(parseAmountToMinor("abc", "EUR")).toBeNull();
  });
});

describe("formatMinor", () => {
  it("formats euro for Albanian and English locales", () => {
    expect(formatMinor(450, "EUR", "sq")).toContain("4,50");
    expect(formatMinor(-1500, "EUR", "en")).toContain("15.00");
  });
});
