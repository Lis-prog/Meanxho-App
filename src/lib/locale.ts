import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/session";

export async function readLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "sq";
}

export async function redirectBack(fallback = "/") {
  const headerStore = await headers();
  const referer = headerStore.get("referer");
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  let destination = fallback;

  if (referer && host) {
    try {
      const url = new URL(referer);
      if (url.host === host && url.pathname.startsWith("/") && !url.pathname.startsWith("//")) {
        destination = `${url.pathname}${url.search}`;
      }
    } catch {
      destination = fallback;
    }
  }

  redirect(destination);
}
