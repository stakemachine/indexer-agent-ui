"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { GraphQLClient } from "graphql-request";
import { AlertCircleIcon, ChevronDownIcon, ChevronRightIcon, DatabaseIcon, Loader2Icon, MinusIcon } from "lucide-react";
import Image from "next/image";
import React from "react";
import useSWR from "swr";
import { DataGrid } from "@/components/data-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { subgraphClient } from "@/lib/graphql/client";
import { SUBGRAPHS_BY_STATUS_QUERY } from "@/lib/graphql/queries";
import { useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";
import { formatGRT } from "@/lib/utils";

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
  entityCount?: number;
  entityLoading?: boolean;
  entityError?: boolean;
  entityNotFound?: boolean;
};

// Shape of the GraphQL response we rely on (subset of fields)
interface SubgraphsQueryResponse {
  graphNetwork: {
    totalTokensSignalled: string;
    networkGRTIssuancePerBlock: string;
    totalTokensAllocated: string;
  };
  subgraphs: Array<{
    metadata: { id: string; displayName: string; image?: string; description?: string };
    signalAmount: string;
    signalledTokens: string;
    active: boolean;
    currentSignalledTokens: string;
    currentVersion: {
      subgraphDeployment: {
        manifest: { network: string; poweredBySubstreams?: boolean };
        ipfsHash: string;
        stakedTokens: string;
        createdAt: string;
        deniedAt: number;
        indexingRewardAmount: string;
        queryFeesAmount: string;
        signalledTokens: string;
        indexerAllocations: Array<{ allocatedTokens: string }>;
      };
    };
  }>;
}

// Calculate blocks per year
const BLOCKS_PER_YEAR = (365 * 60 * 60 * 24) / 12; // 12 seconds per block

// Create a context for sharing entity data across all rows
interface EntityContextType {
  entityData: Map<string, { count?: number; loading: boolean; error: boolean; notFound: boolean }>;
  fetchEntities: (ipfsHashes: string[]) => Promise<void>;
  fetchSingleEntity: (ipfsHash: string) => Promise<void>;
  batchLoading: boolean;
}

const EntityContext = React.createContext<EntityContextType | null>(null);

// Custom hook to use entity context
const useEntityContext = () => {
  const context = React.useContext(EntityContext);
  if (!context) {
    throw new Error("useEntityContext must be used within EntityProvider");
  }
  return context;
};

// Entity Provider Component
function EntityProvider({ children }: { children: React.ReactNode; subgraphs: Subgraph[] }) {
  const [entityData, setEntityData] = React.useState<
    Map<string, { count?: number; loading: boolean; error: boolean; notFound: boolean }>
  >(new Map());
  const [batchLoading, setBatchLoading] = React.useState(false);

  const fetchEntities = React.useCallback(async (ipfsHashes: string[]) => {
    if (ipfsHashes.length === 0) return;

    setBatchLoading(true);

    // Set loading state for all requested hashes
    setEntityData((prev) => {
      const newMap = new Map(prev);
      for (const hash of ipfsHashes) {
        newMap.set(hash, { ...prev.get(hash), loading: true, error: false, notFound: false });
      }
      return newMap;
    });

    try {
      const client = new GraphQLClient("https://indexer.upgrade.thegraph.com/status");
      const query = `
        query indexingStatuses($subgraphs: [String!]!) {
          indexingStatuses(subgraphs: $subgraphs) {
            subgraph
            synced
            health
            entityCount
            fatalError {
              handler
              message
              deterministic
              block {
                hash
                number
              }
            }
            chains {
              network
              chainHeadBlock { number hash }
              earliestBlock { number hash }
              latestBlock { number hash }
              lastHealthyBlock { hash number }
            }
            node
          }
        }
      `;

      const response = await client.request<{
        indexingStatuses: Array<{
          subgraph: string;
          entityCount: number;
        }>;
      }>(query, { subgraphs: ipfsHashes });

      // Create a map of found subgraphs
      const foundSubgraphs = new Map<string, number>();
      response.indexingStatuses?.forEach((status) => {
        if (status.entityCount !== undefined) {
          foundSubgraphs.set(status.subgraph, status.entityCount);
        }
      });

      // Update entity data
      setEntityData((prev) => {
        const newMap = new Map(prev);
        for (const hash of ipfsHashes) {
          const count = foundSubgraphs.get(hash);
          newMap.set(hash, {
            count,
            loading: false,
            error: false,
            notFound: count === undefined,
          });
        }
        return newMap;
      });
    } catch (error) {
      console.error("Failed to fetch entity counts:", error);
      // Set error state for all requested hashes
      setEntityData((prev) => {
        const newMap = new Map(prev);
        for (const hash of ipfsHashes) {
          newMap.set(hash, { ...prev.get(hash), loading: false, error: true, notFound: false });
        }
        return newMap;
      });
    } finally {
      setBatchLoading(false);
    }
  }, []);

  const fetchSingleEntity = React.useCallback(
    async (ipfsHash: string) => {
      await fetchEntities([ipfsHash]);
    },
    [fetchEntities],
  );

  const value = React.useMemo(
    () => ({
      entityData,
      fetchEntities,
      fetchSingleEntity,
      batchLoading,
    }),
    [entityData, fetchEntities, fetchSingleEntity, batchLoading],
  );

  return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>;
}

export function Subgraphs() {
  const { indexerRegistration } = useIndexerRegistrationStore();
  const { currentNetwork } = useNetworkStore();
  const client = subgraphClient(currentNetwork);

  const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(false);

  type Key = [string, string, string];
  const key: Key | null = indexerRegistration?.address
    ? [SUBGRAPHS_BY_STATUS_QUERY, currentNetwork, indexerRegistration.address.toLowerCase()]
    : null;
  const fetcher = ([query]: Key) =>
    client.request<SubgraphsQueryResponse>(query, {
      indexer: indexerRegistration?.address.toLowerCase(),
    });
  const { data, error, isLoading, isValidating, mutate } = useSWR<SubgraphsQueryResponse>(key, fetcher, {
    revalidateOnFocus: false, // avoid reloading when window refocuses during pagination clicks
  });

  const subgraphs: Subgraph[] = React.useMemo(() => {
    if (!data) return [];
    const { totalTokensSignalled, networkGRTIssuancePerBlock, totalTokensAllocated } = data.graphNetwork;
    const totalSignalledFloat = parseFloat(totalTokensSignalled) || 1; // avoid division by zero
    const totalAllocatedFloat = parseFloat(totalTokensAllocated) || 1;
    const annualIssuance = parseFloat(networkGRTIssuancePerBlock) * BLOCKS_PER_YEAR;
    return data.subgraphs.map((sg) => {
      const deploy = sg.currentVersion.subgraphDeployment;
      const signalledTokens = parseFloat(deploy.signalledTokens) || 0;
      const stakedTokens = parseFloat(deploy.stakedTokens) || 0.0000001; // tiny epsilon to guard zero
      const apr = (((signalledTokens / totalSignalledFloat) * annualIssuance) / stakedTokens) * 100;
      const proportion = signalledTokens / totalSignalledFloat / (stakedTokens / totalAllocatedFloat);
      const capacity = (totalAllocatedFloat * (signalledTokens / totalSignalledFloat) - stakedTokens) / 1e18;
      return {
        id: sg.metadata.id,
        displayName: sg.metadata.displayName,
        image: sg.metadata.image || "/placeholder.svg",
        description: sg.metadata.description || "",
        signalAmount: sg.signalAmount,
        signalledTokens: sg.signalledTokens,
        active: sg.active,
        currentSignalledTokens: sg.currentSignalledTokens,
        network: deploy.manifest.network,
        ipfsHash: deploy.ipfsHash,
        stakedTokens: deploy.stakedTokens,
        createdAt: deploy.createdAt,
        deniedAt: deploy.deniedAt,
        poweredBySubstreams: deploy.manifest.poweredBySubstreams || false,
        indexingRewardAmount: deploy.indexingRewardAmount,
        queryFeesAmount: deploy.queryFeesAmount,
        allocatedTokens: deploy.indexerAllocations[0]?.allocatedTokens || "0",
        apr,
        proportion,
        capacity,
      };
    });
  }, [data]);

  // Move columns definition inside component to access entity context
  function SubgraphsTable() {
    const { entityData, fetchSingleEntity } = useEntityContext();

    const columns: ColumnDef<Subgraph>[] = React.useMemo(
      () => [
        {
          id: "expander",
          header: () => null,
          cell: ({ row }) => (
            <button type="button" onClick={row.getToggleExpandedHandler()} className="cursor-pointer">
              {row.getIsExpanded() ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
            </button>
          ),
        },
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
          id: "entities",
          header: "Entities",
          accessorFn: (row) => {
            // Access entity count from context for sorting
            const entityState = entityData.get(row.ipfsHash);
            return entityState?.count ?? row.entityCount;
          },
          sortingFn: (rowA, rowB) => {
            const entityA = entityData.get(rowA.original.ipfsHash);
            const entityB = entityData.get(rowB.original.ipfsHash);

            const countA = entityA?.count ?? rowA.original.entityCount;
            const countB = entityB?.count ?? rowB.original.entityCount;

            // If both have counts, sort by count
            if (countA !== undefined && countB !== undefined) {
              return countA - countB;
            }

            // If only one has a count, prioritize it
            if (countA !== undefined) return -1;
            if (countB !== undefined) return 1;

            // If neither has a count, sort alphabetically by display name
            return rowA.original.displayName.localeCompare(rowB.original.displayName);
          },
          cell: ({ row }) => {
            const subgraph = row.original;

            const entityState = entityData.get(subgraph.ipfsHash) || {
              count: subgraph.entityCount,
              loading: subgraph.entityLoading || false,
              error: subgraph.entityError || false,
              notFound: subgraph.entityNotFound || false,
            };

            if (entityState.count !== undefined) {
              return <div className="text-sm">{entityState.count.toLocaleString()}</div>;
            }

            if (entityState.loading) {
              return <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />;
            }

            if (entityState.error) {
              return (
                <div title="Error fetching entity count">
                  <AlertCircleIcon className="h-4 w-4 text-destructive" />
                </div>
              );
            }

            if (entityState.notFound) {
              return (
                <div title="Not indexed by upgrade indexer">
                  <MinusIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            }

            return (
              <button
                type="button"
                onClick={() => fetchSingleEntity(subgraph.ipfsHash)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Fetch entity count"
              >
                <DatabaseIcon className="h-4 w-4" />
              </button>
            );
          },
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
      [entityData, fetchSingleEntity],
    );

    return (
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
        autoRefreshEnabled={autoRefreshEnabled}
        onAutoRefreshChange={setAutoRefreshEnabled}
        autoRefreshInterval={30000} // 30 seconds
        renderSubComponent={renderSubgraphDetails}
      />
    );
  }

  const renderSubgraphDetails = React.useCallback((subgraph: Subgraph) => {
    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <div className="shrink-0">
              <Image
                src={subgraph.image || "/placeholder.svg"}
                alt={subgraph.displayName}
                width={64}
                height={64}
                className="rounded-lg"
              />
            </div>
            <div className="grow">
              <h3 className="text-lg font-semibold">{subgraph.displayName}</h3>
              <p className="text-sm text-muted-foreground mt-1">{subgraph.description}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm font-medium">IPFS Hash</p>
                  <p className="text-sm text-muted-foreground">{subgraph.ipfsHash}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created At</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(parseInt(subgraph.createdAt) * 1000).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Staked tokens</p>
                  <p className="text-sm text-muted-foreground">
                    {formatGRT(subgraph.stakedTokens, { decimals: 2, withSymbol: true })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Signalled Tokens</p>
                  <p className="text-sm text-muted-foreground">
                    {formatGRT(subgraph.signalledTokens, { decimals: 2, withSymbol: true })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Indexing rewards</p>
                  <p className="text-sm text-muted-foreground">
                    {formatGRT(subgraph.indexingRewardAmount, { decimals: 2, withSymbol: true })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Query fees</p>
                  <p className="text-sm text-muted-foreground">
                    {formatGRT(subgraph.queryFeesAmount, { decimals: 2, withSymbol: true })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">APR</p>
                  <p className="text-sm text-muted-foreground">{subgraph.apr.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Proportion</p>
                  <p className="text-sm text-muted-foreground">{subgraph.proportion.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Available Capacity</p>
                  <p className="text-sm text-muted-foreground">{subgraph.capacity.toFixed(2)} GRT</p>
                </div>
                {subgraph.entityCount !== undefined && (
                  <div>
                    <p className="text-sm font-medium">Entity Count</p>
                    <p className="text-sm text-muted-foreground">{subgraph.entityCount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, []);

  // Batch fetch controls component
  function BatchControls() {
    const { fetchEntities, batchLoading } = useEntityContext();

    const handleLoadAllEntities = () => {
      const allHashes = subgraphs.map((sg) => sg.ipfsHash);
      fetchEntities(allHashes);
    };

    return (
      <Button variant="outline" size="sm" onClick={handleLoadAllEntities} disabled={batchLoading}>
        {batchLoading ? (
          <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <DatabaseIcon className="h-4 w-4 mr-2" />
        )}
        Load All Entities
      </Button>
    );
  }

  return (
    <EntityProvider subgraphs={subgraphs}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div></div>
          <BatchControls />
        </div>
        <SubgraphsTable />
      </div>
    </EntityProvider>
  );
}
