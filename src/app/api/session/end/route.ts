import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";

export async function GET(request: Request) {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  const url = new URL(request.url);
  const next = url.searchParams.get("next") === "/" ? "/" : "/login";
  return NextResponse.redirect(new URL(next, request.url));
}
