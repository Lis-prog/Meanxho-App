"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  href: string;
  label: string;
};

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Menaxho">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 cursor-pointer items-center rounded-2xl px-3 py-2.5 text-base font-semibold transition ${active ? "bg-pine-soft text-pine-deep hover:bg-[#d7ebe1]" : "text-ink hover:bg-white hover:text-pine-deep"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 px-2 py-2 backdrop-blur md:hidden" aria-label="Menaxho">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const add = item.href === "/add";
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-2xl text-xs font-medium transition hover:bg-paper ${add ? "text-pine" : active ? "text-ink" : "text-muted hover:text-ink"}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
