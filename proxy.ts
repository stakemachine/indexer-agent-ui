import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Proxy no longer rewrites /api/agent or /api/subgraph/*.
// Those paths are now handled by dedicated route handlers (app/api/agent, app/api/subgraph/[network]).
// Removing rewrites eliminates the x-proxy-rewrite response header and preserves original request URL.

// Next.js 16 requires the exported function to be named `proxy` (not `middleware`)
export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// If you still want auth only on specific paths, restore matcher array.
// Apply auth middleware to all routes except Next.js internals, auth endpoints themselves, and common public assets.
// This pattern matches everything that does NOT start with:
// - /api/auth (NextAuth internal & credential posting)
// - /_next/static (build output)
// - /_next/image (image optimizer)
// - /favicon.ico (site icon)
export const config = {
  matcher: ["/((?!api/auth|signin|_next/static|_next/image|favicon.ico).*)"],
};
