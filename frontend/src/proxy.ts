import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

// UX fast-path only, not the security boundary: presence-only cookie check
// ahead of (app) rendering. Express still rejects an invalid/expired token.
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/profile/:path*"],
};
