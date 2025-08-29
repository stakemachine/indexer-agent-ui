"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow, fromUnixTime } from "date-fns";
import { GraphQLClient } from "graphql-request";
import React from "react";
import useSWR from "swr";
import { DataGrid } from "@/components/data-grid";
import { Badge } from "@/components/ui/badge";
import { ALLOCATIONS_BY_INDEXER_QUERY } from "@/lib/graphql/queries";
import { useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";
import { formatGRT } from "@/lib/utils";

interface RawAllocation {
  id: string;
  allocatedTokens: string; // raw wei string
  createdAtEpoch: string;
  closedAtEpoch?: string | null;
  createdAt: string; // unix seconds string
  closedAt?: string | null;
  status: string;
  indexingRewards: string;
  indexingIndexerRewards: string;
  indexingDelegatorRewards: string;
  queryFeesCollected: string;
  poi: string;
  subgraphDeployment: {
    manifest: { network: string };
    ipfsHash: string;
    originalName?: string | null;
    stakedTokens: string;
    signalledTokens: string;
    versions?: Array<{
      subgraph?: { metadata?: { displayName?: string | null; description?: string | null } };
    }>;
  };
}

type AllocationsQueryResponse = {
  allocations: RawAllocation[];
};

type Allocation = {
  id: string;
  allocatedTokens: string; // keep as string; convert only for display
  createdAt: number;
  closedAt: number | null;
  status: string;
  indexingRewards: string;
  queryFeesCollected: string;
  network: string;
  subgraphName: string;
  subgraphDeployment: {
    ipfsHash: string;
    originalName: string;
  };
};

const columns: ColumnDef<Allocation>[] = [
  {
    accessorKey: "id",
    header: "Allocation ID",
    cell: ({ row }) => <div className="w-[180px] truncate">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "subgraphDeployment",
    header: "Subgraph",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">
          {row.original.subgraphDeployment.originalName ? row.original.subgraphDeployment.originalName : "N/A"}
        </span>
        <span className="text-xs text-muted-foreground">{row.original.subgraphDeployment.ipfsHash}</span>
      </div>
    ),
  },
  {
    accessorKey: "allocatedTokens",
    header: "Allocated Tokens",
    cell: ({ row }) => <div>{formatGRT(row.getValue("allocatedTokens"), { decimals: 2, withSymbol: true })}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) =>
      formatDistanceToNow(fromUnixTime(row.getValue("createdAt")), {
        addSuffix: true,
      }),
  },
  {
    accessorKey: "closedAt",
    header: "Closed",
    cell: ({ row }) =>
      row.getValue("closedAt")
        ? formatDistanceToNow(fromUnixTime(row.getValue("closedAt")), {
            addSuffix: true,
          })
        : "Active",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.getValue("status") === "Active"
            ? "bg-emerald-500/10 text-emerald-500 border-0"
            : "bg-red-500/10 text-red-500 border-0"
        }
      >
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    accessorKey: "indexingRewards",
    header: "Indexing Rewards",
    cell: ({ row }) => <div>{formatGRT(row.getValue("indexingRewards"), { decimals: 2, withSymbol: true })}</div>,
  },
  {
    accessorKey: "queryFeesCollected",
    header: "Query Fees",
    cell: ({ row }) => <div>{formatGRT(row.getValue("queryFeesCollected"), { decimals: 2, withSymbol: true })}</div>,
  },
  {
    accessorKey: "network",
    header: "Network",
  },
];

export function Allocations() {
  const { indexerRegistration } = useIndexerRegistrationStore();
  const { currentNetwork } = useNetworkStore();
  const client = new GraphQLClient(`/api/subgraph/${currentNetwork}`);
  const fetcher = (query: string) =>
    client.request<AllocationsQueryResponse>(query, {
      indexer: indexerRegistration?.address.toLowerCase(),
    });
  const { data, error, isLoading, isValidating, mutate } = useSWR<AllocationsQueryResponse>(
    indexerRegistration?.address ? ALLOCATIONS_BY_INDEXER_QUERY : null,
    fetcher,
  );

  const allocations: Allocation[] = React.useMemo(() => {
    if (!data || !data.allocations) return [];
    return data.allocations.map((a) => ({
      id: a.id,
      allocatedTokens: a.allocatedTokens,
      createdAt: Number.parseInt(a.createdAt, 10),
      closedAt: a.closedAt ? Number.parseInt(a.closedAt, 10) : null,
      status: a.status,
      indexingRewards: a.indexingRewards,
      queryFeesCollected: a.queryFeesCollected,
      network: a.subgraphDeployment.manifest.network,
      subgraphName: a.subgraphDeployment.originalName || "Unknown",
      subgraphDeployment: {
        ipfsHash: a.subgraphDeployment.ipfsHash,
        originalName: a.subgraphDeployment.originalName || "Unknown",
      },
    }));
  }, [data]);

  return (
    <DataGrid
      columns={columns}
      data={allocations}
      onRefresh={() => mutate()}
      error={error ? "Failed to load allocations" : null}
      isLoading={isLoading}
      isValidating={isValidating}
      initialState={{
        sorting: [{ id: "createdAt", desc: true }],
      }}
    />
  );
}
