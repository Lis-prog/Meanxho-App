import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "menaxho_session";
export const LOCALE_COOKIE = "menaxho_locale";

export type SessionPayload = {
  sub: string;
  sv: number;
};

function secret(): Uint8Array | null {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) return null;
  return new TextEncoder().encode(value);
}

export async function signSession(userId: string, sessionVersion: number): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  return new SignJWT({ sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const key = secret();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (typeof payload.sub !== "string" || typeof payload.sv !== "number") return null;
    return { sub: payload.sub, sv: payload.sv };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
