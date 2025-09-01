"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow, fromUnixTime } from "date-fns";
import { GraphQLClient } from "graphql-request";
import React from "react";
import useSWR from "swr";
import { DataGrid } from "@/components/data-grid";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { agentClient } from "@/lib/graphql/client";
import { ALLOCATIONS_BY_INDEXER_QUERY, CREATE_ACTION_MUTATION } from "@/lib/graphql/queries";
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
      subgraph?: {
        metadata?: {
          displayName?: string | null;
          description?: string | null;
        };
      };
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
  createdAtEpoch: string;
  closedAt: number | null;
  status: string;
  indexingRewards: string;
  queryFeesCollected: string;
  signalledTokens: string;
  stakedTokens: string;
  network: string;
  subgraphName: string;
  subgraphDeployment: {
    ipfsHash: string;
    originalName: string;
  };
  // For unallocation - we need the deployment hash
  subgraphDeploymentHash: string;
};

const columns: ColumnDef<Allocation>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => {
      const isActive = row.original.status === "Active";
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          disabled={!isActive}
          className={!isActive ? "opacity-50" : ""}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
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
        <span className="font-medium">{row.original.subgraphDeployment.originalName}</span>
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
    accessorKey: "signalledTokens",
    header: "Signalled Tokens",
    cell: ({ row }) => <div>{formatGRT(row.getValue("signalledTokens"), { decimals: 2, withSymbol: true })}</div>,
  },
  {
    accessorKey: "stakedTokens",
    header: "Staked Tokens",
    cell: ({ row }) => <div>{formatGRT(row.getValue("stakedTokens"), { decimals: 2, withSymbol: true })}</div>,
  },
  {
    accessorKey: "createdAtEpoch",
    header: "Created At Epoch",
    cell: ({ row }) => <div>{row.getValue("createdAtEpoch")}</div>,
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
    return data.allocations.map((a) => {
      // Try to get displayName from metadata first, fallback to originalName
      const displayName =
        a.subgraphDeployment.versions?.[0]?.subgraph?.metadata?.displayName ||
        a.subgraphDeployment.originalName ||
        null;

      return {
        id: a.id,
        allocatedTokens: a.allocatedTokens,
        createdAt: Number.parseInt(a.createdAt, 10),
        createdAtEpoch: a.createdAtEpoch,
        closedAt: a.closedAt ? Number.parseInt(a.closedAt, 10) : null,
        status: a.status,
        indexingRewards: a.indexingRewards,
        queryFeesCollected: a.queryFeesCollected,
        signalledTokens: a.subgraphDeployment.signalledTokens,
        stakedTokens: a.subgraphDeployment.stakedTokens,
        network: a.subgraphDeployment.manifest.network,
        subgraphName: displayName || "N/A",
        subgraphDeployment: {
          ipfsHash: a.subgraphDeployment.ipfsHash,
          originalName: displayName || "N/A",
        },
        subgraphDeploymentHash: a.subgraphDeployment.ipfsHash,
      };
    });
  }, [data]);

  const handleUnallocate = async (selectedRows: Allocation[]) => {
    const client = agentClient();
    const actions = selectedRows.map((row) => ({
      type: "unallocate",
      deploymentID: row.subgraphDeploymentHash,
      source: "Agent UI",
      reason: "manual",
      status: "queued",
      priority: 0,
      allocationID: row.id,
      protocolNetwork: currentNetwork,
    }));

    try {
      await client.request(CREATE_ACTION_MUTATION, { actions });
      toast({
        title: "Unallocation queued",
        description: `Successfully queued ${actions.length} unallocation(s)`,
      });
      mutate(); // Refresh the data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to queue unallocation(s)",
        variant: "destructive",
      });
      console.error("Failed to queue unallocation(s):", error);
    }
  };

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
      batchActions={[
        {
          label: "Unallocate",
          onClick: handleUnallocate,
        },
      ]}
    />
  );
}
