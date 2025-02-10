import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(function middleware(request: NextRequest) {
	if (request.nextUrl.pathname.startsWith("/api/agent")) {
		return NextResponse.rewrite(
			new URL(process.env.AGENT_ENDPOINT as string, request.url),
		);
	}
	if (request.nextUrl.pathname.startsWith("/api/subgraph")) {
		const networkName = request.nextUrl.pathname.split("/")[3];
		return NextResponse.rewrite(
			new URL(
				(process.env.AGENT_NETWORK_ENDPOINT as string) + networkName,
				request.url,
			),
		);
	}
	return NextResponse.next();
});
