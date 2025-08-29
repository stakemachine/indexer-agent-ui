"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import React from "react";
import useSWR from "swr";
import { DataGrid } from "@/components/data-grid";
import { Badge } from "@/components/ui/badge";
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

const columns: ColumnDef<Subgraph>[] = [
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => (
      <button type="button" onClick={row.getToggleExpandedHandler()} className="cursor-pointer">
        {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
];

// Calculate blocks per year
const BLOCKS_PER_YEAR = (365 * 60 * 60 * 24) / 12; // 12 seconds per block

export function Subgraphs() {
  const { indexerRegistration } = useIndexerRegistrationStore();
  const { currentNetwork } = useNetworkStore();
  const client = subgraphClient(currentNetwork);

  const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(false);

  type Key = [string];
  const fetcher = ([query]: Key) =>
    client.request<SubgraphsQueryResponse>(query, {
      indexer: indexerRegistration?.address.toLowerCase(),
    });
  const key: Key | null = indexerRegistration?.address ? [SUBGRAPHS_BY_STATUS_QUERY] : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR<SubgraphsQueryResponse>(key, fetcher);

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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch id="auto-refresh-control" checked={autoRefreshEnabled} onCheckedChange={setAutoRefreshEnabled} />
        <Label htmlFor="auto-refresh-control">Auto-refresh</Label>
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
        autoRefreshEnabled={autoRefreshEnabled}
        onAutoRefreshChange={setAutoRefreshEnabled}
        autoRefreshInterval={30000} // 30 seconds
        renderSubComponent={renderSubgraphDetails}
      />
    </div>
  );
}
