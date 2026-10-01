import { redirect } from "next/navigation";
import { BottomNav, SideNav } from "@/components/nav";
import { Wordmark } from "@/components/brand";
import { logoutAction } from "@/server/auth";
import { getCurrentUser } from "@/lib/current-user";
import { isLocale, t, type Locale } from "@/lib/i18n";

export default async function ShellLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  const locale: Locale = user.locale;

  const items = [
    { href: "/dashboard", label: t(locale, "navHome") },
    { href: "/add", label: t(locale, "navAdd") },
    { href: "/transactions", label: t(locale, "navHistory") },
    { href: "/income", label: t(locale, "navIncome") },
  ];
  const mobile = [
    { href: "/dashboard", label: t(locale, "navHome") },
    { href: "/add", label: t(locale, "navAdd") },
    { href: "/transactions", label: t(locale, "navHistory") },
    { href: "/settings", label: t(locale, "navSettings") },
  ];

  return (
    <div className="mx-auto grid min-h-full w-full max-w-6xl md:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line px-5 py-6 md:flex md:flex-col">
        <Wordmark />
        <div className="mt-8">
          <SideNav items={[...items, { href: "/settings", label: t(locale, "navSettings") }]} />
        </div>
        <form action={logoutAction} className="mt-auto pt-8">
          <button className="text-sm text-muted hover:text-ink" type="submit">
            {t(locale, "logout")}
          </button>
        </form>
      </aside>
      <div className="min-w-0 px-5 py-6 pb-28 md:px-8 md:pb-10">
        <div className="mb-6 flex items-center justify-between md:hidden">
          <Wordmark />
          <form action={logoutAction}>
            <button className="text-sm text-muted" type="submit">
              {t(locale, "logout")}
            </button>
          </form>
        </div>
        <div id="content">{children}</div>
      </div>
      <BottomNav items={mobile} />
    </div>
  );
}
