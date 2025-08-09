import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import { buildNetworkSubgraphEndpoint, env } from "@/lib/env";

export default withAuth(function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/agent")) {
    return NextResponse.rewrite(new URL(env.AGENT_ENDPOINT, request.url));
  }
  if (request.nextUrl.pathname.startsWith("/api/subgraph")) {
    const networkName = request.nextUrl.pathname.split("/")[3];
    try {
      const endpoint = buildNetworkSubgraphEndpoint(networkName);
      return NextResponse.rewrite(new URL(endpoint, request.url));
    } catch {
      return NextResponse.json({ error: "Invalid network" }, { status: 400 });
    }
  }
  return NextResponse.next();
});
