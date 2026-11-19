import type { CurrencyCode } from "@/lib/categories";

const EXPONENT: Record<CurrencyCode, number> = {
  EUR: 2,
  USD: 2,
  GBP: 2,
  ALL: 2,
  MKD: 2,
};

/** 10,000,000.00 in minor units. Enough for personal finance, safe as an integer. */
export const MAX_MINOR = 1_000_000_000;

export function exponentFor(currency: string): number {
  if (currency in EXPONENT) return EXPONENT[currency as CurrencyCode];
  return 2;
}

export function parseAmountToMinor(input: string, currency: string): number | null {
  const exponent = exponentFor(currency);
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;

  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > exponent) return null;
  if (whole.length > 10) return null;

  const minor =
    Number(whole) * 10 ** exponent + Number(fraction.padEnd(exponent, "0") || "0");

  if (!Number.isSafeInteger(minor) || minor <= 0 || minor > MAX_MINOR) return null;
  return minor;
}

export function parseMinorAllowZero(input: string, currency: string): number | null {
  const exponent = exponentFor(currency);
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;

  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > exponent) return null;
  if (whole.length > 10) return null;

  const minor =
    Number(whole) * 10 ** exponent + Number(fraction.padEnd(exponent, "0") || "0");

  if (!Number.isSafeInteger(minor) || minor < 0 || minor > MAX_MINOR) return null;
  return minor;
}

/** Empty input becomes 0. Invalid input is still null. */
export function parseOptionalMinor(input: string, currency: string): number | null {
  if (input.trim() === "") return 0;
  return parseMinorAllowZero(input, currency);
}

export function minorToInput(amountMinor: number, currency: string): string {
  const exponent = exponentFor(currency);
  return (amountMinor / 10 ** exponent).toFixed(exponent);
}

export function formatMinor(amountMinor: number, currency: string, locale: string): string {
  const exponent = exponentFor(currency);
  const major = amountMinor / 10 ** exponent;
  return new Intl.NumberFormat(locale === "sq" ? "sq-AL" : "en-GB", {
    style: "currency",
    currency: currency in EXPONENT ? currency : "EUR",
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(major);
}
