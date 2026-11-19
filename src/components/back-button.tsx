import Link from "next/link";
import { quietButtonClass } from "@/lib/styles";

function BackArrow() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M12.5 4.5 7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 10h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={quietButtonClass}>
      <BackArrow />
      {label}
    </Link>
  );
}
