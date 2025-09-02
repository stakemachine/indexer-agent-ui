"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow, fromUnixTime } from "date-fns";
import { GraphQLClient } from "graphql-request";
import { DatabaseIcon, Loader2Icon } from "lucide-react";
import React from "react";
import useSWR from "swr";
import { DataGrid } from "@/components/data-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { isRewardsSupported } from "@/lib/contracts/rewards";
import { agentClient } from "@/lib/graphql/client";
import { ALLOCATIONS_BY_INDEXER_QUERY, CREATE_ACTION_MUTATION } from "@/lib/graphql/queries";
import { useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";
import { formatGRT } from "@/lib/utils";
import { RewardsProvider, useRewardsContext } from "./rewards-context";

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

// Allocations table component that uses rewards context
function AllocationsTable() {
  const { indexerRegistration } = useIndexerRegistrationStore();
  const { currentNetwork } = useNetworkStore();
  const rewardsSupported = isRewardsSupported(currentNetwork);

  // Define columns inside component to access rewards context
  const columnsWithRewards: ColumnDef<Allocation>[] = React.useMemo(() => {
    const baseColumns = [...columns];

    // Add pending rewards column if supported
    if (rewardsSupported) {
      const pendingRewardsColumn: ColumnDef<Allocation> = {
        id: "pendingRewards",
        header: "Pending Rewards",
        cell: ({ row }) => <PendingRewardsCell allocation={row.original} />,
        enableSorting: false,
      };

      // Insert before network column (last column)
      baseColumns.splice(-1, 0, pendingRewardsColumn);
    }

    return baseColumns;
  }, [rewardsSupported]);

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

  // Prepare allocations data for rewards context
  const allocationsForContext = React.useMemo(() => {
    return allocations.map((a) => ({
      id: a.id,
      status: a.status,
    }));
  }, [allocations]);

  return (
    <div className="space-y-4">
      {rewardsSupported && <BatchRewardsControls allocations={allocationsForContext} />}
      <DataGrid
        columns={columnsWithRewards}
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
    </div>
  );
}

// Component for individual pending rewards cell
function PendingRewardsCell({ allocation }: { allocation: Allocation }) {
  const { pendingRewards, fetchReward, batchLoading } = useRewardsContext();
  const isActive = allocation.status === "Active";
  const rewardState = pendingRewards[allocation.id];

  if (!isActive) {
    return <div className="text-muted-foreground">—</div>;
  }

  const handleLoadReward = () => {
    fetchReward(allocation.id);
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="min-w-0 flex-1">
        {rewardState?.loading ? (
          <div className="flex items-center space-x-1">
            <Loader2Icon className="h-3 w-3 animate-spin" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : rewardState?.error ? (
          <div className="text-xs text-red-500">Error</div>
        ) : rewardState?.amount && rewardState.amount !== "0" ? (
          <div className="text-sm">{formatGRT(rewardState.amount, { decimals: 2, withSymbol: true })}</div>
        ) : (
          <div className="text-muted-foreground">—</div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLoadReward}
        disabled={rewardState?.loading || batchLoading}
        className="h-6 w-6 p-0"
      >
        {rewardState?.loading ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <DatabaseIcon className="h-3 w-3" />}
      </Button>
    </div>
  );
}

// Batch controls for loading all pending rewards
function BatchRewardsControls({ allocations }: { allocations: Array<{ id: string; status: string }> }) {
  const { fetchRewards, batchLoading } = useRewardsContext();

  const handleLoadAllRewards = () => {
    const activeAllocationIds = allocations
      .filter((allocation) => allocation.status === "Active")
      .map((allocation) => allocation.id);

    if (activeAllocationIds.length > 0) {
      fetchRewards(activeAllocationIds);
    }
  };

  const activeCount = allocations.filter((a) => a.status === "Active").length;

  if (activeCount === 0) {
    return null;
  }

  return (
    <div className="flex justify-end">
      <Button variant="outline" size="sm" onClick={handleLoadAllRewards} disabled={batchLoading}>
        {batchLoading ? (
          <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <DatabaseIcon className="h-4 w-4 mr-2" />
        )}
        Load All Pending Rewards ({activeCount})
      </Button>
    </div>
  );
}

export function Allocations() {
  const { indexerRegistration } = useIndexerRegistrationStore();
  const { currentNetwork } = useNetworkStore();
  const client = new GraphQLClient(`/api/subgraph/${currentNetwork}`);
  const fetcher = (query: string) =>
    client.request<AllocationsQueryResponse>(query, {
      indexer: indexerRegistration?.address.toLowerCase(),
    });
  const { data } = useSWR<AllocationsQueryResponse>(
    indexerRegistration?.address ? ALLOCATIONS_BY_INDEXER_QUERY : null,
    fetcher,
  );

  // Prepare allocations for rewards context
  const allocationsForContext = React.useMemo(() => {
    if (!data?.allocations) return [];
    return data.allocations.map((a) => ({
      id: a.id,
      status: a.status,
    }));
  }, [data]);

  return (
    <RewardsProvider allocations={allocationsForContext}>
      <AllocationsTable />
    </RewardsProvider>
  );
}
