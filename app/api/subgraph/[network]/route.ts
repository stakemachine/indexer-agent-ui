import { buildNetworkSubgraphEndpoint } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GraphQLRequest = { query?: string; variables?: Record<string, unknown>; operationName?: string };

async function forward(network: string, body: GraphQLRequest) {
  if (!body.query || typeof body.query !== "string") {
    return Response.json({ error: "Missing GraphQL query" }, { status: 400 });
  }
  let endpoint: string;
  try {
    endpoint = buildNetworkSubgraphEndpoint(network);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query: body.query, variables: body.variables, operationName: body.operationName }),
      cache: "no-store",
    });
    const text = await upstream.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return Response.json({ error: "Invalid JSON from upstream", raw: text }, { status: 502 });
    }
    if (!upstream.ok) {
      return Response.json(
        { error: "Upstream error", status: upstream.status, data: json },
        { status: upstream.status },
      );
    }
    return Response.json(json, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { network: string } }) {
  let body: GraphQLRequest = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  return forward(params.network, body);
}

export function GET() {
  return Response.json({ error: "Use POST for GraphQL queries" }, { status: 405 });
}
