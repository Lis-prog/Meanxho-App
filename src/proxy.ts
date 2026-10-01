import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const PROTECTED = [/^\/dashboard(?:\/|$)/, /^\/transactions(?:\/|$)/, /^\/add(?:\/|$)/, /^\/income(?:\/|$)/, /^\/settings(?:\/|$)/];
const GUEST_ONLY = [/^\/login$/, /^\/register$/, /^\/forgot-password$/, /^\/reset-password$/];

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const { pathname } = request.nextUrl;

  if (PROTECTED.some((pattern) => pattern.test(pathname)) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const response = NextResponse.redirect(url);
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (GUEST_ONLY.some((pattern) => pattern.test(pathname)) && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|webp)$).*)"],
};
