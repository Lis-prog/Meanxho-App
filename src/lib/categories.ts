export const CATEGORY_CATALOG = [
  { key: "groceries", group: "food", icon: "basket" },
  { key: "restaurants", group: "food", icon: "utensils" },
  { key: "coffee", group: "food", icon: "cup" },
  { key: "fuel", group: "transport", icon: "car" },
  { key: "taxi", group: "transport", icon: "car" },
  { key: "public_transport", group: "transport", icon: "bus" },
  { key: "clothing", group: "personal", icon: "shirt" },
  { key: "cosmetics", group: "personal", icon: "spark" },
  { key: "hygiene", group: "personal", icon: "drop" },
  { key: "subscriptions", group: "digital", icon: "play" },
  { key: "pharmacy", group: "health", icon: "plus" },
  { key: "entertainment", group: "entertainment", icon: "ticket" },
  { key: "rent", group: "housing", icon: "home" },
  { key: "utilities", group: "housing", icon: "bolt" },
  { key: "loan", group: "financial", icon: "bank" },
  { key: "other", group: "other", icon: "dot" },
] as const;

export const GROUP_KEYS = [
  "food",
  "housing",
  "transport",
  "personal",
  "financial",
  "digital",
  "health",
  "entertainment",
  "other",
] as const;

export type GroupKey = (typeof GROUP_KEYS)[number];

export const CURRENCIES = ["EUR", "ALL", "MKD", "USD", "GBP"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const PAYMENT_METHODS = ["cash", "card", "transfer", "credit", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const INCOME_KINDS = ["salary", "freelance", "bonus", "other"] as const;
export type IncomeKind = (typeof INCOME_KINDS)[number];

export const CADENCES = ["monthly", "once"] as const;
export type Cadence = (typeof CADENCES)[number];

export const TIMEZONES = [
  "Europe/Belgrade",
  "Europe/Tirane",
  "Europe/Skopje",
  "UTC",
] as const;

export type TimezoneId = (typeof TIMEZONES)[number];
