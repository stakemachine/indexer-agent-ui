"use client";

import type { ColumnDef } from "@tanstack/react-table";
import React from "react";
import useSWR from "swr";
import { DataGrid } from "@/components/data-grid";
import { Badge } from "@/components/ui/badge";
import { createSchemaFetcher } from "@/lib/fetchers";
import { AGENT_INDEXER_DEPLOYMENTS_QUERY } from "@/lib/graphql/queries";
import { type IndexerDeploymentsResponse, IndexerDeploymentsResponseSchema } from "@/lib/graphql/schemas";
import { useNetworkStore } from "@/lib/store";

type Deployment = {
  subgraphDeployment: string;
  synced: boolean;
  health: string;
  node: string;
  network: string;
  earliest: number;
  latest: number;
  chainhead: number;
  behind: number;
};

const columns: ColumnDef<Deployment>[] = [
  {
    accessorKey: "subgraphDeployment",
    header: "Deployment ID",
    cell: ({ row }) => <div className="w-[180px] truncate">{row.getValue("subgraphDeployment")}</div>,
  },
  {
    accessorKey: "synced",
    header: "Synced",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.getValue("synced") ? "bg-emerald-500/10 text-emerald-500 border-0" : "bg-red-500/10 text-red-500 border-0"
        }
      >
        {row.getValue("synced") ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    accessorKey: "health",
    header: "Health",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.getValue("health") === "healthy"
            ? "bg-emerald-500/10 text-emerald-500 border-0"
            : "bg-red-500/10 text-red-500 border-0"
        }
      >
        {row.getValue("health")}
      </Badge>
    ),
  },
  {
    accessorKey: "node",
    header: "Node",
  },
  {
    accessorKey: "network",
    header: "Network",
  },
  {
    accessorKey: "earliest",
    header: "Earliest",
  },
  {
    accessorKey: "latest",
    header: "Latest",
  },
  {
    accessorKey: "chainhead",
    header: "Chainhead",
  },
  {
    accessorKey: "behind",
    header: "Behind",
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue(columnId) as number;
      const b = rowB.getValue(columnId) as number;
      return a > b ? 1 : a < b ? -1 : 0;
    },
  },
];

// client not needed; schemaFetcher constructs its own GraphQLClient

export function IndexerDeployments() {
  const { currentNetwork } = useNetworkStore();

  const schemaFetcher = React.useMemo(
    () =>
      createSchemaFetcher({
        endpoint: "/api/agent",
        schema: IndexerDeploymentsResponseSchema,
      }),
    [],
  );
  const { data, error, isLoading, isValidating, mutate } = useSWR<IndexerDeploymentsResponse>(
    [AGENT_INDEXER_DEPLOYMENTS_QUERY, { protocolNetwork: currentNetwork }],
    ([query, variables]) => schemaFetcher(query as string, variables as Record<string, unknown>),
  );

  const deployments: Deployment[] = React.useMemo(() => {
    if (!data?.indexerDeployments) return [];
    return data.indexerDeployments.map((deployment) => ({
      subgraphDeployment: deployment.subgraphDeployment,
      synced: deployment.synced,
      // Normalize health to a lowercase string; only literal "healthy" is treated as healthy
      health:
        typeof deployment.health === "string"
          ? deployment.health.toLowerCase()
          : deployment.health
            ? "healthy"
            : "unhealthy",
      node: deployment.node,
      network: deployment.chains[0]?.network || "Unknown",
      earliest: Number(deployment.chains[0]?.earliestBlock.number) || 0,
      latest: Number(deployment.chains[0]?.latestBlock?.number) || 0,
      chainhead: Number(deployment.chains[0]?.chainHeadBlock.number) || 0,
      behind:
        (Number(deployment.chains[0]?.chainHeadBlock.number) || 0) -
        (Number(deployment.chains[0]?.latestBlock?.number) || 0),
    }));
  }, [data]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Indexer Deployments</h2>
      <DataGrid
        columns={columns}
        data={deployments}
        onRefresh={() => mutate()}
        autoRefreshEnabled={true}
        autoRefreshInterval={60000} // Set to 1 minute
        error={error ? "Failed to load deployments" : null}
        isLoading={isLoading}
        isValidating={isValidating}
        initialState={{
          sorting: [{ id: "behind", desc: true }],
        }}
      />
    </div>
  );
}
