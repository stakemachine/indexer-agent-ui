"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { GeistMono } from "geist/font/mono";
import React from "react";
import useSWR from "swr";
import { DataGrid } from "@/components/data-grid";
import { toast } from "@/hooks/use-toast";
import { createSchemaFetcher } from "@/lib/fetchers";
import { agentClient } from "@/lib/graphql/client";
import { AGENT_ALLOCATIONS_QUERY, CREATE_ACTION_MUTATION } from "@/lib/graphql/queries";
import { type AgentAllocationsResponse, AgentAllocationsResponseSchema } from "@/lib/graphql/schemas";
import { useNetworkStore } from "@/lib/store";
import { formatGRT } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";

type Allocation = {
  id: string;
  subgraphDeployment: string;
  allocatedTokens: string;
  signalledTokens: string;
  stakedTokens: string;
  createdAt: string;
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
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "Allocation ID",
    cell: ({ row }) => <div className="">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "subgraphDeployment",
    header: "Subgraph Deployment",
    cell: ({ row }) => <div className="">{row.getValue("subgraphDeployment")}</div>,
  },
  {
    accessorKey: "allocatedTokens",
    header: "Allocated Tokens",
    cell: ({ row }) => (
      <div className={`${GeistMono.className}`}>{formatGRT(row.getValue("allocatedTokens"), { decimals: 0 })}</div>
    ),
  },
  {
    accessorKey: "signalledTokens",
    header: "Signalled Tokens",
    cell: ({ row }) => (
      <div className={`${GeistMono.className}`}>{formatGRT(row.getValue("signalledTokens"), { decimals: 0 })}</div>
    ),
  },
  {
    accessorKey: "stakedTokens",
    header: "Staked Tokens",
    cell: ({ row }) => (
      <div className={` ${GeistMono.className}`}>{formatGRT(row.getValue("stakedTokens"), { decimals: 0 })}</div>
    ),
  },
  {
    accessorKey: "createdAtEpoch",
    header: "Created At Epoch",
    cell: ({ row }) => (
      <div className={`w-[40px] truncate ${GeistMono.className}`}>{row.getValue("createdAtEpoch")}</div>
    ),
  },
];

const client = agentClient();

export function ActiveAllocations() {
  const { currentNetwork } = useNetworkStore();

  const schemaFetcher = React.useMemo(
    () =>
      createSchemaFetcher({
        endpoint: "/api/agent",
        schema: AgentAllocationsResponseSchema,
      }),
    [],
  );
  const { data, error, isLoading, isValidating, mutate } = useSWR<AgentAllocationsResponse>(
    AGENT_ALLOCATIONS_QUERY,
    (query) => schemaFetcher(query, { protocolNetwork: currentNetwork }),
  );

  const allocations: Allocation[] = React.useMemo(() => {
    if (!data) return [];
    return data.indexerAllocations.map((a) => ({
      id: a.id,
      subgraphDeployment: a.subgraphDeployment,
      allocatedTokens: a.allocatedTokens,
      signalledTokens: a.signalledTokens || "0",
      stakedTokens: a.stakedTokens || "0",
      createdAt: String(a.createdAtEpoch ?? "0"),
    }));
  }, [data]);

  const handleUnallocate = async (selectedRows: Allocation[]) => {
    const actions = selectedRows.map((row) => ({
      type: "unallocate",
      deploymentID: row.subgraphDeployment,
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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Active Allocations</h2>
      <DataGrid
        columns={columns}
        data={allocations}
        onRefresh={() => mutate()}
        autoRefreshInterval={60000} // Set to 1 minute
        error={error ? error.message : null}
        isLoading={isLoading}
        isValidating={isValidating}
        initialState={{
          sorting: [{ id: "allocatedTokens", desc: true }],
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
