import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("sessionid")?.value);
  // Do not hard-block private routes in dev because backend cookie host can
  // differ (localhost vs 127.0.0.1). Client pages can still validate /auth/me.
  if (hasSession && PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};
