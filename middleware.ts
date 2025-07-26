import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export default withAuth(function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/agent")) {
    const agentEndpoint = assertEnv("AGENT_ENDPOINT");
    return NextResponse.rewrite(new URL(agentEndpoint, request.url));
  }
  if (request.nextUrl.pathname.startsWith("/api/subgraph")) {
    const networkName = request.nextUrl.pathname.split("/")[3];
    const networkEndpoint = assertEnv("AGENT_NETWORK_ENDPOINT");
    return NextResponse.rewrite(new URL(networkEndpoint + networkName, request.url));
  }
  return NextResponse.next();
});
