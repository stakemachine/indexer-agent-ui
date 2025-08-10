import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

// Middleware no longer rewrites /api/agent or /api/subgraph/*.
// Those paths are now handled by dedicated route handlers (app/api/agent, app/api/subgraph/[network]).
// Removing rewrites eliminates the x-middleware-rewrite response header and preserves original request URL.
export default withAuth(function middleware() {
  return NextResponse.next();
});

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
