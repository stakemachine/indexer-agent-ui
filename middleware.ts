import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get("authorization");
  const url = request.nextUrl;

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    const [user, pwd] = atob(authValue).split(":");
    const envUser = process.env.UI_LOGIN ? process.env.UI_LOGIN : "agent";
    const envPass = process.env.UI_PASS ? process.env.UI_PASS : "password";
    if (user === envUser && pwd === envPass) {
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
    }
  }

  url.pathname = "/api/auth";

  return NextResponse.rewrite(url);
}
