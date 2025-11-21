import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/branding") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check Supabase auth cookies set by @supabase/ssr
  const hasAccess = Boolean(req.cookies.get("sb-access-token")?.value);
  const hasRefresh = Boolean(req.cookies.get("sb-refresh-token")?.value);

  if (!hasAccess && !hasRefresh) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // protect everything except next internals, assets, branding, login, and api
    "/((?!api|_next/static|_next/image|favicon.ico|branding/.*|login).*)",
  ],
};
