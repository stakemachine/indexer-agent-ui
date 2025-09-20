"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { GraphQLClient } from "graphql-request";
import { DatabaseIcon, Loader2Icon, MinusIcon } from "lucide-react";
import Image from "next/image";
import React from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { DataGrid } from "@/components/data-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { subgraphClient } from "@/lib/graphql/client";
import { SUBGRAPHS_BY_STATUS_QUERY } from "@/lib/graphql/queries";
import { useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";
import { formatGRT } from "@/lib/utils";

// Calculate blocks per year
const BLOCKS_PER_YEAR = (365 * 60 * 60 * 24) / 12; // 12 seconds per block

type Subgraph = {
  id: string;
  displayName: string;
  image: string;
  description: string;
  signalAmount: string;
  signalledTokens: string;
  active: boolean;
  currentSignalledTokens: string;
  network: string;
  ipfsHash: string;
  stakedTokens: string;
  createdAt: string;
  deniedAt: number;
  poweredBySubstreams: boolean;
  indexingRewardAmount: string;
  queryFeesAmount: string;
  allocatedTokens: string;
  apr: number;
  proportion: number;
  capacity: number;
};

// Shape of the GraphQL response we rely on (subset of fields)
interface SubgraphsQueryResponse {
  graphNetwork: {
    totalTokensSignalled: string;
    networkGRTIssuancePerBlock: string;
    totalTokensAllocated: string;
  };
  subgraphs: Array<{
    metadata: {
      id: string;
      displayName: string;
      image: string;
      description: string;
    };
    signalAmount: string;
    signalledTokens: string;
    active: boolean;
    currentSignalledTokens: string;
    currentVersion: {
      subgraphDeployment: {
        manifest: {
          network: string;
          poweredBySubstreams: boolean;
        };
        originalName: string;
        ipfsHash: string;
        stakedTokens: string;
        createdAt: string;
        deniedAt: number;
        signalledTokens: string;
        signalAmount: string;
        pricePerShare: string;
        indexingRewardAmount: string;
        queryFeesAmount: string;
        indexerAllocations: Array<{
          id: string;
          allocatedTokens: string;
        }>;
      };
    };
  }>;
}

// Simple fetcher for entity counts
const fetchEntityCount = async (ipfsHash: string): Promise<number> => {
  try {
    const client = new GraphQLClient("https://indexer.upgrade.thegraph.com/status");
    const query = `
      query indexingStatuses($subgraphs: [String!]!) {
        indexingStatuses(subgraphs: $subgraphs) {
          subgraph
          entityCount
        }
      }
    `;

    const response = await client.request<{
      indexingStatuses: Array<{
        subgraph: string;
        entityCount: number;
      }>;
    }>(query, { subgraphs: [ipfsHash] });

    const status = response.indexingStatuses[0];
    if (!status || status.entityCount === undefined) {
      // Return -1 to indicate entity count is not available rather than throwing
      return -1;
    }

    return status.entityCount;
  } catch (error) {
    // For network errors or other issues, return -1 to indicate unavailable
    console.warn(
      `Entity count fetch failed for ${ipfsHash.slice(0, 8)}...:`,
      error instanceof Error ? error.message : error,
    );
    return -1;
  }
};

// Batch fetcher for multiple entity counts
const fetchBatchEntityCounts = async (_: string, { arg }: { arg: string[] }): Promise<Record<string, number>> => {
  try {
    const client = new GraphQLClient("https://indexer.upgrade.thegraph.com/status");
    const query = `
      query indexingStatuses($subgraphs: [String!]!) {
        indexingStatuses(subgraphs: $subgraphs) {
          subgraph
          entityCount
        }
      }
    `;

    const response = await client.request<{
      indexingStatuses: Array<{
        subgraph: string;
        entityCount: number;
      }>;
    }>(query, { subgraphs: arg });

    const result: Record<string, number> = {};

    // First, mark all requested subgraphs as not available
    arg.forEach((subgraph) => {
      result[subgraph] = -1;
    });

    // Then update with actual entity counts where available
    response.indexingStatuses.forEach((status) => {
      if (status.entityCount !== undefined) {
        result[status.subgraph] = status.entityCount;
      }
    });

    return result;
  } catch (error) {
    // For network errors, return -1 for all requested subgraphs
    console.warn("Batch entity count fetch failed:", error instanceof Error ? error.message : error);
    const result: Record<string, number> = {};
    arg.forEach((subgraph) => {
      result[subgraph] = -1;
    });
    return result;
  }
};

// Component for entity count cell - moved outside to avoid hook issues
function EntityCell({
  ipfsHash,
  batchData,
  batchMutating,
  batchError,
}: {
  ipfsHash: string;
  batchData?: Record<string, number>;
  batchMutating: boolean;
  batchError: unknown;
}) {
  const {
    data: entityCount,
    error: entityError,
    isMutating: entityLoading,
    trigger,
  } = useSWRMutation(`entity-${ipfsHash}`, () => fetchEntityCount(ipfsHash));

  const batchCount = batchData?.[ipfsHash];
  const count = batchCount ?? entityCount;
  const loading = entityLoading || (batchMutating && !batchData);
  const error = entityError || (batchError && !batchData);

  if (count !== undefined && count >= 0) {
    return <div className="text-sm">{count.toLocaleString()}</div>;
  }

  if (count === -1) {
    return (
      <div title="Entity count not available or not indexed">
        <MinusIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  if (loading) {
    return <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (error) {
    return (
      <div title="Error fetching entity count">
        <MinusIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => trigger()}
      className="text-muted-foreground hover:text-foreground transition-colors"
      title="Fetch entity count"
    >
      <DatabaseIcon className="h-4 w-4" />
    </button>
  );
}

export function Subgraphs() {
  const { indexerRegistration } = useIndexerRegistrationStore();
  const { currentNetwork } = useNetworkStore();
  const client = subgraphClient(currentNetwork);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    indexerRegistration?.address
      ? [SUBGRAPHS_BY_STATUS_QUERY, currentNetwork, indexerRegistration.address.toLowerCase()]
      : null,
    async () => {
      return await client.request<SubgraphsQueryResponse>(SUBGRAPHS_BY_STATUS_QUERY, {
        indexer: indexerRegistration?.address.toLowerCase(),
        protocolNetwork: currentNetwork,
      });
    },
  );

  // Batch fetch mutation
  const batchFetch = useSWRMutation("batch-entities", fetchBatchEntityCounts);

  const subgraphs: Subgraph[] = React.useMemo(() => {
    if (!data) return [];

    const totalTokensSignalled = Number(data.graphNetwork.totalTokensSignalled);
    const totalTokensAllocated = Number(data.graphNetwork.totalTokensAllocated);
    const networkGRTIssuancePerBlock = Number(data.graphNetwork.networkGRTIssuancePerBlock);

    const totalSignalledFloat = totalTokensSignalled || 1; // avoid division by zero
    const totalAllocatedFloat = totalTokensAllocated || 1;
    const annualIssuance = networkGRTIssuancePerBlock * BLOCKS_PER_YEAR;

    const result = data.subgraphs.flatMap((sg) => {
      // Check if currentVersion exists
      if (!sg.currentVersion) {
        return [];
      }

      const deploy = sg.currentVersion.subgraphDeployment;

      // Add null checks for potentially undefined properties
      if (!deploy) {
        return [];
      }

      const signalledTokens = parseFloat(deploy.signalledTokens) || 0;
      const stakedTokens = parseFloat(deploy.stakedTokens) || 0.0000001; // tiny epsilon to guard zero

      // Original calculations from the previous version
      const apr = (((signalledTokens / totalSignalledFloat) * annualIssuance) / stakedTokens) * 100;
      const proportion = signalledTokens / totalSignalledFloat / (stakedTokens / totalAllocatedFloat);
      const capacity = (totalAllocatedFloat * (signalledTokens / totalSignalledFloat) - stakedTokens) / 1e18;

      return [
        {
          id: sg.metadata?.id || "",
          displayName: sg.metadata?.displayName || "Unknown",
          image: sg.metadata?.image || "",
          description: sg.metadata?.description || "",
          signalAmount: sg.signalAmount || "0",
          signalledTokens: sg.signalledTokens || "0",
          active: sg.active ?? false,
          currentSignalledTokens: sg.currentSignalledTokens || "0",
          network: deploy.manifest?.network || "unknown",
          ipfsHash: deploy.ipfsHash || "",
          stakedTokens: deploy.stakedTokens || "0",
          createdAt: deploy.createdAt || "",
          deniedAt: deploy.deniedAt || 0,
          poweredBySubstreams: deploy.manifest?.poweredBySubstreams || false,
          indexingRewardAmount: deploy.indexingRewardAmount || "0",
          queryFeesAmount: deploy.queryFeesAmount || "0",
          allocatedTokens: deploy.indexerAllocations?.[0]?.allocatedTokens || "0",
          apr,
          proportion,
          capacity,
        },
      ];
    });

    return result;
  }, [data]);

  const columns: ColumnDef<Subgraph>[] = React.useMemo(
    () => [
      {
        accessorKey: "displayName",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center space-x-2 overflow-hidden">
            <Image
              src={row.original.image || "/placeholder.svg"}
              alt={row.original.displayName}
              width={32}
              height={32}
              className="rounded-lg"
            />
            <div className="flex flex-col">
              <span className="font-medium">{row.getValue("displayName")}</span>
              <span className="text-xs text-muted-foreground">{row.original.ipfsHash}</span>
              <div>
                {row.original.deniedAt !== 0 && <Badge variant="destructive">DENIED</Badge>}
                {row.original.poweredBySubstreams && <Badge variant="secondary">Substreams</Badge>}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "network",
        header: "Network",
      },
      {
        accessorKey: "status",
        header: "Status",
        accessorFn: (row) => (row.deniedAt !== 0 ? "Denied" : "Active"),
        cell: ({ row }) =>
          row.original.deniedAt !== 0 ? (
            <Badge variant="destructive">DENIED</Badge>
          ) : (
            <Badge variant="secondary">Active</Badge>
          ),
      },
      {
        accessorKey: "substreams",
        header: "Substreams",
        accessorFn: (row) => (row.poweredBySubstreams ? "Yes" : "No"),
        cell: ({ row }) =>
          row.original.poweredBySubstreams ? (
            <Badge variant="secondary">Yes</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">No</span>
          ),
      },
      {
        id: "entities",
        header: "Entities",
        accessorFn: (row) => {
          // Access entity count from batch data for sorting
          const batchCount = batchFetch.data?.[row.ipfsHash];
          return batchCount !== undefined && batchCount >= 0 ? batchCount : undefined;
        },
        sortingFn: (rowA, rowB) => {
          const batchDataA = batchFetch.data?.[rowA.original.ipfsHash];
          const batchDataB = batchFetch.data?.[rowB.original.ipfsHash];

          // If both have entity counts, sort by count
          if (batchDataA !== undefined && batchDataA >= 0 && batchDataB !== undefined && batchDataB >= 0) {
            return batchDataA - batchDataB;
          }

          // If only one has a count, prioritize it
          if (batchDataA !== undefined && batchDataA >= 0) return -1;
          if (batchDataB !== undefined && batchDataB >= 0) return 1;

          // If neither has a count, sort alphabetically by display name
          return rowA.original.displayName.localeCompare(rowB.original.displayName);
        },
        enableSorting: true,
        cell: ({ row }) => (
          <EntityCell
            ipfsHash={row.original.ipfsHash}
            batchData={batchFetch.data}
            batchMutating={batchFetch.isMutating}
            batchError={batchFetch.error}
          />
        ),
      },
      {
        accessorKey: "currentSignalledTokens",
        header: "Signalled Tokens",
        cell: ({ row }) => <div>{formatGRT(row.getValue("currentSignalledTokens"), { decimals: 2 })}</div>,
      },
      {
        accessorKey: "stakedTokens",
        header: "Staked Tokens",
        cell: ({ row }) => <div>{formatGRT(row.getValue("stakedTokens"), { decimals: 2 })}</div>,
      },
      {
        accessorKey: "indexingRewardAmount",
        header: "Indexing Reward",
        cell: ({ row }) => <div>{formatGRT(row.getValue("indexingRewardAmount"), { decimals: 2 })}</div>,
      },
      {
        accessorKey: "queryFeesAmount",
        header: "Query fees",
        cell: ({ row }) => <div>{formatGRT(row.getValue("queryFeesAmount"), { decimals: 2 })}</div>,
      },
      {
        accessorKey: "allocatedTokens",
        header: "Allocated Tokens",
        cell: ({ row }) => <div>{formatGRT(row.getValue("allocatedTokens") || "0", { decimals: 2 })}</div>,
      },
      {
        accessorKey: "apr",
        header: "APR",
        cell: ({ row }) => {
          const v = row.getValue("apr");
          const num = typeof v === "number" ? v : Number(v ?? 0);
          return <div>{num.toFixed(2)}%</div>;
        },
      },
      {
        accessorKey: "proportion",
        header: "Prop",
        cell: ({ row }) => {
          const v = row.getValue("proportion");
          const num = typeof v === "number" ? v : Number(v ?? 0);
          return <div>{num.toFixed(3)}</div>;
        },
      },
      {
        accessorKey: "capacity",
        header: "Available Capacity",
        cell: ({ row }) => {
          const v = row.getValue("capacity");
          const num = typeof v === "number" ? v : Number(v ?? 0);
          return <div>{num.toFixed(2)}</div>;
        },
      },
    ],
    [batchFetch.data, batchFetch.isMutating, batchFetch.error],
  );

  const handleLoadAllEntities = () => {
    const allHashes = subgraphs.map((sg) => sg.ipfsHash);
    batchFetch.trigger(allHashes);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div></div>
        <Button variant="outline" size="sm" onClick={handleLoadAllEntities} disabled={batchFetch.isMutating}>
          {batchFetch.isMutating ? (
            <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <DatabaseIcon className="h-4 w-4 mr-2" />
          )}
          Load All Entities
        </Button>
      </div>
      <DataGrid
        columns={columns}
        data={subgraphs}
        onRefresh={() => mutate()}
        error={error ? "Failed to load subgraphs" : null}
        isLoading={isLoading}
        isValidating={isValidating}
        initialState={{
          sorting: [{ id: "currentSignalledTokens", desc: true }],
        }}
        enableFilterSidebar
        persistKey="subgraphs.filters"
      />
    </div>
  );
}
