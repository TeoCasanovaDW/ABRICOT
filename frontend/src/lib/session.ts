import { cookies } from "next/headers";

// Name/flags shared by every place the session cookie is read, set, or
// cleared. Write/clear helpers built on top of this live alongside the
// login/register/logout Route Handlers, not here.
export const SESSION_COOKIE_NAME = "abricot_session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Read-only; available to Server Components and Route Handlers alike.
// Cookie mutation only happens in a Route Handler or proxy.ts.
export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

const EXPIRES_IN_UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
};

// Converts a jsonwebtoken-style JWT_EXPIRES_IN string (e.g. "7d") into a
// seconds integer for the cookie `maxAge` API, which never accepts the raw
// string.
export function parseExpiresInToSeconds(expiresIn: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(expiresIn.trim());

  if (!match) {
    throw new Error(`Invalid JWT_EXPIRES_IN value: "${expiresIn}"`);
  }

  const [, amount, unit] = match;
  return Number(amount) * EXPIRES_IN_UNIT_SECONDS[unit];
}

// Write/clear helpers, used only by the register/login/logout Route
// Handlers. "7d" mirrors the backend's own default (backend/src/utils/jwt.ts)
// since no frontend env var carries this value.
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: parseExpiresInToSeconds(process.env.JWT_EXPIRES_IN ?? "7d"),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
