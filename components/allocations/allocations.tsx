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

  // Shared rewards state for all allocation cells
  const [rewardsData, setRewardsData] = React.useState<
    Record<
      string,
      {
        amount: string;
        loading: boolean;
        error: boolean;
        errorMessage?: string;
      }
    >
  >({});

  // Define columns inside component to access rewards context
  const columnsWithRewards: ColumnDef<Allocation>[] = React.useMemo(() => {
    const baseColumns = [...columns];

    // Add pending rewards column if supported
    if (rewardsSupported) {
      const pendingRewardsColumn: ColumnDef<Allocation> = {
        id: "pendingRewards",
        header: "Pending Rewards",
        cell: ({ row }) => (
          <PendingRewardsCell
            allocation={row.original}
            rewardState={rewardsData[row.original.id]}
            onUpdateReward={(allocationId, state) => {
              setRewardsData((prev) => ({ ...prev, [allocationId]: state }));
            }}
          />
        ),
        enableSorting: false,
      };

      // Insert before network column (last column)
      baseColumns.splice(-1, 0, pendingRewardsColumn);
    }

    return baseColumns;
  }, [rewardsSupported, rewardsData]);

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

  // Prepare allocations data for batch rewards controls
  const allocationsForBatch = React.useMemo(() => {
    return allocations.map((a) => ({
      id: a.id,
      status: a.status,
    }));
  }, [allocations]);

  return (
    <div className="space-y-4">
      {rewardsSupported && (
        <BatchRewardsControls
          allocations={allocationsForBatch}
          onUpdateRewards={(updates) => {
            setRewardsData((prev) => ({ ...prev, ...updates }));
          }}
        />
      )}
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
        // T022: Pilot enable filter sidebar only on allocations table
        enableFilterSidebar
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
function PendingRewardsCell({
  allocation,
  rewardState,
  onUpdateReward,
}: {
  allocation: Allocation;
  rewardState?: {
    amount: string;
    loading: boolean;
    error: boolean;
    errorMessage?: string;
  };
  onUpdateReward: (
    allocationId: string,
    state: {
      amount: string;
      loading: boolean;
      error: boolean;
      errorMessage?: string;
    },
  ) => void;
}) {
  const { currentNetwork } = useNetworkStore();

  const isActive = allocation.status === "Active";
  const rewardsSupported = isRewardsSupported(currentNetwork);

  if (!isActive || !rewardsSupported) {
    return <div className="text-muted-foreground">—</div>;
  }

  const currentState = rewardState || {
    amount: "0",
    loading: false,
    error: false,
  };

  // Determine if we have attempted to load (has state in rewardsData)
  const hasAttemptedLoad = !!rewardState;

  const handleLoadReward = async () => {
    onUpdateReward(allocation.id, { ...currentState, loading: true, error: false });

    try {
      const { fetchPendingReward } = await import("@/lib/contracts/rewards");
      const result = await fetchPendingReward(allocation.id, currentNetwork);

      if (result.error) {
        onUpdateReward(allocation.id, {
          amount: "0",
          loading: false,
          error: true,
          errorMessage: result.error,
        });
      } else {
        onUpdateReward(allocation.id, {
          amount: result.amount,
          loading: false,
          error: false,
        });
      }
    } catch (error) {
      console.error(`Error fetching reward for allocation ${allocation.id}:`, error);
      onUpdateReward(allocation.id, {
        amount: "0",
        loading: false,
        error: true,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-w-[120px]">
      {currentState.loading ? (
        // Loading state: Show only spinner
        <Loader2Icon className="h-3 w-3 animate-spin" />
      ) : hasAttemptedLoad ? (
        // After loading attempt: Show result only (no icon)
        currentState.error ? (
          <div className="text-xs text-red-500">Error</div>
        ) : currentState.amount && currentState.amount !== "0" ? (
          <div className="text-sm">{formatGRT(currentState.amount, { decimals: 2, withSymbol: true })}</div>
        ) : (
          <div className="text-muted-foreground">—</div>
        )
      ) : (
        // Initial state: Show only the database icon
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLoadReward}
          className="h-6 w-6 p-0"
          title="Load pending rewards"
        >
          <DatabaseIcon className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Batch controls for loading all pending rewards
function BatchRewardsControls({
  allocations,
  onUpdateRewards,
}: {
  allocations: Array<{ id: string; status: string }>;
  onUpdateRewards: (
    updates: Record<
      string,
      {
        amount: string;
        loading: boolean;
        error: boolean;
        errorMessage?: string;
      }
    >,
  ) => void;
}) {
  const { currentNetwork } = useNetworkStore();
  const [batchLoading, setBatchLoading] = React.useState(false);

  const handleLoadAllRewards = async () => {
    const activeAllocationIds = allocations
      .filter((allocation) => allocation.status === "Active")
      .map((allocation) => allocation.id);

    if (activeAllocationIds.length === 0) return;

    setBatchLoading(true);

    // Set loading state for all allocations
    const loadingUpdates: Record<
      string,
      {
        amount: string;
        loading: boolean;
        error: boolean;
        errorMessage?: string;
      }
    > = {};

    activeAllocationIds.forEach((id) => {
      loadingUpdates[id] = {
        amount: "0",
        loading: true,
        error: false,
      };
    });
    onUpdateRewards(loadingUpdates);

    try {
      const { fetchPendingRewardsBatch } = await import("@/lib/contracts/rewards");
      const result = await fetchPendingRewardsBatch(activeAllocationIds, currentNetwork);

      // Update all the individual cell states with the results
      const rewardUpdates: Record<
        string,
        {
          amount: string;
          loading: boolean;
          error: boolean;
          errorMessage?: string;
        }
      > = {};

      // Process successful results
      result.results.forEach((rewardResult) => {
        if (rewardResult.error) {
          rewardUpdates[rewardResult.allocationId] = {
            amount: "0",
            loading: false,
            error: true,
            errorMessage: rewardResult.error,
          };
        } else {
          rewardUpdates[rewardResult.allocationId] = {
            amount: rewardResult.amount,
            loading: false,
            error: false,
          };
        }
      });

      // Set any missing allocations as error
      activeAllocationIds.forEach((id) => {
        if (!rewardUpdates[id]) {
          rewardUpdates[id] = {
            amount: "0",
            loading: false,
            error: true,
            errorMessage: "No result returned",
          };
        }
      });

      onUpdateRewards(rewardUpdates);

      // Show success/error toasts
      if (result.results.length > 0) {
        toast({
          title: "Rewards loaded",
          description: `Loaded rewards for ${result.results.length} allocations`,
        });
      }

      if (result.errors.length > 0) {
        toast({
          title: "Some errors occurred",
          description: `${result.errors.length} allocations had errors`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in batch rewards fetch:", error);

      // Set all to error state
      const errorUpdates: Record<
        string,
        {
          amount: string;
          loading: boolean;
          error: boolean;
          errorMessage?: string;
        }
      > = {};

      activeAllocationIds.forEach((id) => {
        errorUpdates[id] = {
          amount: "0",
          loading: false,
          error: true,
          errorMessage: "Batch fetch failed",
        };
      });
      onUpdateRewards(errorUpdates);

      toast({
        title: "Error",
        description: "Failed to load batch rewards",
        variant: "destructive",
      });
    } finally {
      setBatchLoading(false);
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
  return <AllocationsTable />;
}
