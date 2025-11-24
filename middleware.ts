import { NextResponse, type NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  // Temporarily disable auth redirection in middleware because client-side login
  // stores session in localStorage (not cookies), which middleware cannot read.
  // Server/API routes already enforce authorization.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // protect everything except next internals, assets, branding, login, and api
    "/((?!api|_next/static|_next/image|favicon.ico|branding/.*|login).*)",
  ],
};
