import { GraphQLClient } from "graphql-request";

// Create a memoized client cache per absolute endpoint to avoid recreating instances
const clientCache = new Map<string, GraphQLClient>();

function getClient(endpoint: string): GraphQLClient {
  const existing = clientCache.get(endpoint);
  if (existing) return existing;
  const created = new GraphQLClient(endpoint);
  clientCache.set(endpoint, created);
  return created;
}

export function agentClient() {
  return getClient("/api/agent");
}

export function subgraphClient(network: string) {
  return getClient(`/api/subgraph/${network}`);
}

export type GraphQLTupleKey<V extends Record<string, unknown>> = [string, V];

type NetworkLike = { protocolNetwork?: string; network?: string };

export function tupleFetcher<TData, TVars extends Record<string, unknown>>([
  query,
  variables,
]: GraphQLTupleKey<TVars>): Promise<TData> {
  const maybe = variables as TVars & NetworkLike;
  const network = maybe.protocolNetwork || maybe.network;
  const client = network ? subgraphClient(network) : agentClient();
  return client.request<TData>(query, variables);
}
