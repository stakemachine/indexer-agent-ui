import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/agent")) {
    return NextResponse.rewrite(
      new URL(process.env.AGENT_ENDPOINT, request.url)
    );
  }
  if (request.nextUrl.pathname.startsWith("/api/subgraph")) {
    return NextResponse.rewrite(
      new URL(process.env.SUBGRAPH_ENDPOINT, request.url)
    );
  }
  return NextResponse.next();
});
