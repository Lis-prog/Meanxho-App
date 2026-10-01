import type { CurrencyCode, GroupKey, PaymentMethod, TimezoneId } from "@/lib/categories";
import { en } from "@/lib/i18n/en";
import { sq, type MessageKey } from "@/lib/i18n/sq";

export type Locale = "sq" | "en";

const dictionaries: Record<Locale, Record<MessageKey, string>> = { sq, en };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "sq" || value === "en";
}

export function translateError(locale: Locale, error?: string): string | null {
  if (!error) return null;
  if (error in sq) return t(locale, error as MessageKey);
  return t(locale, "errorGeneric");
}

export function t(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  const template = dictionaries[locale][key] ?? dictionaries.sq[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ""));
}

const categoryKey: Record<string, MessageKey> = {
  groceries: "catGroceries",
  restaurants: "catRestaurants",
  coffee: "catCoffee",
  rent: "catRent",
  utilities: "catUtilities",
  fuel: "catFuel",
  taxi: "catTaxi",
  public_transport: "catPublicTransport",
  clothing: "catClothing",
  cosmetics: "catCosmetics",
  hygiene: "catHygiene",
  loan: "catLoan",
  subscriptions: "catSubscriptions",
  pharmacy: "catPharmacy",
  entertainment: "catEntertainment",
  other: "catOther",
};

const groupKey: Record<GroupKey, MessageKey> = {
  food: "groupFood",
  housing: "groupHousing",
  transport: "groupTransport",
  personal: "groupPersonal",
  financial: "groupFinancial",
  digital: "groupDigital",
  health: "groupHealth",
  entertainment: "groupEntertainment",
  other: "groupOther",
};

const paymentKey: Record<PaymentMethod, MessageKey> = {
  cash: "payCash",
  card: "payCard",
  transfer: "payTransfer",
  credit: "payCredit",
  other: "payOther",
};

const timezoneKey: Record<TimezoneId, MessageKey> = {
  "Europe/Belgrade": "timeBelgrade",
  "Europe/Tirane": "timeTirane",
  "Europe/Skopje": "timeSkopje",
  UTC: "timeUtc",
};

const kindKey = {
  salary: "kindSalary",
  freelance: "kindFreelance",
  bonus: "kindBonus",
  other: "kindOther",
} as const satisfies Record<string, MessageKey>;

export function categoryLabel(
  locale: Locale,
  category: { key: string; customName: string | null },
): string {
  if (category.customName) return category.customName;
  const key = categoryKey[category.key];
  return key ? t(locale, key) : category.key;
}

export function groupLabel(locale: Locale, key: string): string {
  if (key in groupKey) return t(locale, groupKey[key as GroupKey]);
  return key;
}

export function paymentLabel(locale: Locale, method: string): string {
  if (method in paymentKey) return t(locale, paymentKey[method as PaymentMethod]);
  return method;
}

export function timezoneLabel(locale: Locale, zone: string): string {
  if (zone in timezoneKey) return t(locale, timezoneKey[zone as TimezoneId]);
  return zone;
}

export function incomeKindLabel(locale: Locale, kind: string): string {
  if (kind in kindKey) return t(locale, kindKey[kind as keyof typeof kindKey]);
  return kind;
}

export function isCurrency(value: string): value is CurrencyCode {
  return value === "EUR" || value === "ALL" || value === "MKD" || value === "USD" || value === "GBP";
}
