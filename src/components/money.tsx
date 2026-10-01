import { formatMinor } from "@/lib/money";

export function Money({
  amountMinor,
  currency,
  locale,
  className = "",
}: {
  amountMinor: number;
  currency: string;
  locale: string;
  className?: string;
}) {
  return (
    <span className={`tabular-nums ${amountMinor < 0 ? "text-danger" : ""} ${className}`}>
      {formatMinor(amountMinor, currency, locale)}
    </span>
  );
}
