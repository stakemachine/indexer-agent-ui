"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { GraphQLClient, gql } from "graphql-request";
import React from "react";
import useSWR from "swr";
import { DataGrid } from "@/components/data-grid";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { createSchemaFetcher } from "@/lib/fetchers";
import { type IndexingRulesResponse, IndexingRulesResponseSchema } from "@/lib/graphql/schemas";
import { resolveChainAlias } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";

const INDEXING_RULES_LIST_QUERY = gql`
  {
    indexingRules(merged: true) {
      identifier
      identifierType
      allocationAmount
      allocationLifetime
      autoRenewal
      parallelAllocations
      maxAllocationPercentage
      minSignal
      maxSignal
      minStake
      minAverageQueryFees
      custom
      decisionBasis
      requireSupported
      safety
      protocolNetwork
    }
  }
`;

const DELETE_INDEXING_RULES_MUTATION = gql`
  mutation deleteIndexingRules($identifiers: [IndexingRuleIdentifier!]!) {
    deleteIndexingRules(identifiers: $identifiers)
  }
`;

type IndexingRule = {
  identifier: string;
  identifierType?: string | null;
  allocationAmount?: string | null;
  allocationLifetime: number | null;
  autoRenewal?: boolean | null;
  parallelAllocations: number | null;
  maxAllocationPercentage: number | string | null;
  minSignal?: string | null;
  maxSignal?: string | null;
  minStake?: string | null;
  minAverageQueryFees?: string | null;
  custom?: string | null;
  decisionBasis?: string | null;
  requireSupported?: boolean | null;
  safety?: boolean | null;
  protocolNetwork: string;
};

const columns: ColumnDef<IndexingRule>[] = [
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
    accessorKey: "identifier",
    header: "Identifier",
  },
  {
    accessorKey: "identifierType",
    header: "Identifier Type",
  },
  {
    accessorKey: "allocationAmount",
    header: "Allocation Amount",
    cell: ({ row }) => {
      const val = row.getValue("allocationAmount") as string | null | undefined;
      if (!val) return <div className="text-muted-foreground">—</div>;
      const num = Number.parseFloat(val);
      if (Number.isNaN(num)) return <div className="text-muted-foreground">—</div>;
      return <div>{(num / 1e18).toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "decisionBasis",
    header: "Decision Basis",
  },
  {
    accessorKey: "protocolNetwork",
    header: "Protocol Network",
    cell: (row) => resolveChainAlias(row.getValue() as string),
  },
  {
    accessorKey: "allocationLifetime",
    header: "Allocation Lifetime",
  },
  {
    accessorKey: "autoRenewal",
    header: "Auto Renewal",
    cell: ({ row }) => <Switch checked={!!row.getValue("autoRenewal")} disabled />,
  },
  {
    accessorKey: "parallelAllocations",
    header: "Parallel Allocations",
  },
  {
    accessorKey: "maxAllocationPercentage",
    header: "Max Allocation %",
    cell: ({ row }) => {
      const v = row.getValue("maxAllocationPercentage") as string | number | null | undefined;
      if (v == null || v === "") return <span className="text-muted-foreground">—</span>;
      return <>{v}%</>;
    },
  },
  {
    accessorKey: "minSignal",
    header: "Min Signal",
  },
  {
    accessorKey: "maxSignal",
    header: "Max Signal",
  },
  {
    accessorKey: "minStake",
    header: "Min Stake",
  },
  {
    accessorKey: "minAverageQueryFees",
    header: "Min Avg Query Fees",
  },

  {
    accessorKey: "requireSupported",
    header: "Require Supported",
    cell: ({ row }) => <Switch checked={!!row.getValue("requireSupported")} disabled />,
  },
  {
    accessorKey: "safety",
    header: "Safety",
    cell: ({ row }) => <Switch checked={!!row.getValue("safety")} disabled />,
  },
];

const client = new GraphQLClient("/api/agent");

export function Rules() {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(false);

  const schemaFetcher = React.useMemo(
    () =>
      createSchemaFetcher({
        endpoint: "/api/agent",
        schema: IndexingRulesResponseSchema,
      }),
    [],
  );
  const { data, error, isLoading, isValidating, mutate } = useSWR<IndexingRulesResponse>(
    INDEXING_RULES_LIST_QUERY,
    (q) => schemaFetcher(q),
  );

  const rules: IndexingRule[] = React.useMemo(() => {
    if (!data?.indexingRules) return [];
    return data.indexingRules.map((r) => ({
      ...r,
      allocationLifetime: Number(r.allocationLifetime),
      parallelAllocations: Number(r.parallelAllocations),
      maxAllocationPercentage: Number(r.maxAllocationPercentage),
    }));
  }, [data]);

  const handleDelete = async (selectedRules: IndexingRule[]) => {
    const identifiers = selectedRules.map((rule) => ({
      identifier: rule.identifier,
      protocolNetwork: rule.protocolNetwork,
    }));
    try {
      await client.request(DELETE_INDEXING_RULES_MUTATION, { identifiers });
      toast({
        title: "Rules deleted",
        description: `Successfully deleted ${identifiers.length} rule(s)`,
      });
      mutate(); // Refresh the data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete rule(s)",
        variant: "destructive",
      });
      console.error("Failed to delete rule(s):", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch id="auto-refresh-control" checked={autoRefreshEnabled} onCheckedChange={setAutoRefreshEnabled} />
        <Label htmlFor="auto-refresh-control">Auto-refresh</Label>
      </div>
      <DataGrid
        columns={columns}
        data={rules}
        onRefresh={() => mutate()}
        error={error ? "Failed to load indexing rules" : null}
        isLoading={isLoading}
        isValidating={isValidating}
        autoRefreshEnabled={autoRefreshEnabled}
        onAutoRefreshChange={setAutoRefreshEnabled}
        autoRefreshInterval={30000} // 30 seconds
        batchActions={[
          {
            label: "Delete",
            onClick: handleDelete,
          },
        ]}
      />
    </div>
  );
}
