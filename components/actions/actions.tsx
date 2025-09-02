"use client";

import type { ColumnDef } from "@tanstack/react-table";
import React from "react";
import useSWR from "swr";
import { DataGrid } from "@/components/data-grid";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { createSchemaFetcher } from "@/lib/fetchers";
import { agentClient } from "@/lib/graphql/client";
import {
  ACTIONS_LIST_QUERY,
  APPROVE_ACTIONS_MUTATION,
  CANCEL_ACTIONS_MUTATION,
  DELETE_ACTIONS_MUTATION,
} from "@/lib/graphql/queries";
import { type ActionsResponse, ActionsResponseSchema } from "@/lib/graphql/schemas";

import { resolveChainAlias } from "@/lib/utils";

type Action = {
  id: number;
  type: string;
  deploymentID: string | null | undefined;
  allocationID: string | null | undefined;
  amount: string | null | undefined;
  poi: string;
  force: boolean;
  source: string;
  reason: string;
  priority: number;
  status: string;
  failureReason: string | null;
  transaction: string | null;
  protocolNetwork: string;
};

const columns: ColumnDef<Action>[] = [
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
    header: "ID",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "deploymentID",
    header: "Deployment ID",
    cell: ({ row }) => {
      const v = row.getValue("deploymentID") as string | null | undefined;
      return <div className="w-[180px] truncate">{v || <span className="text-muted-foreground">—</span>}</div>;
    },
  },
  {
    accessorKey: "allocationID",
    header: "Allocation ID",
    cell: ({ row }) => {
      const v = row.getValue("allocationID") as string | null | undefined;
      return <div className="w-[180px] truncate">{v || <span className="text-muted-foreground">—</span>}</div>;
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const val = row.getValue("amount") as string | null | undefined;
      if (!val) return <div className="text-muted-foreground">—</div>;
      const num = Number.parseFloat(val);
      if (Number.isNaN(num)) return <div className="text-muted-foreground">—</div>;
      return <div>{num.toLocaleString()} GRT</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.getValue("status") === "approved"
            ? "bg-emerald-500/10 text-orange-500 border-0"
            : row.getValue("status") === "queued"
              ? "bg-yellow-500/10 text-yellow-500 border-0"
              : row.getValue("status") === "canceled"
                ? "bg-gray-500/10 text-gray-500 border-0"
                : row.getValue("status") === "success"
                  ? "bg-emerald-500/10 text-emerald-500 border-0"
                  : "bg-red-500/10 text-red-500 border-0"
        }
      >
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
  },
  {
    accessorKey: "protocolNetwork",
    header: "Network",
    cell: (row) => resolveChainAlias(row.getValue() as string),
  },
];

const client = agentClient();

export function Actions() {
  // const { currentNetwork } = useNetworkStore();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(false);

  const schemaFetcher = React.useMemo(
    () =>
      createSchemaFetcher({
        endpoint: "/api/agent",
        schema: ActionsResponseSchema,
      }),
    [],
  );
  // Use structured key to avoid logging the entire GraphQL query as the key (reduces noisy error echoes)
  const { data, error, isLoading, mutate } = useSWR<ActionsResponse>(["actions", "list"], () =>
    schemaFetcher(ACTIONS_LIST_QUERY),
  );

  const actions: Action[] = React.useMemo(() => {
    if (!data?.actions) return [];
    return data.actions.map((action) => ({
      id: typeof action.id === "string" ? parseInt(action.id, 10) : action.id,
      type: action.type,
      deploymentID: action.deploymentID,
      allocationID: action.allocationID ?? null,
      amount: action.amount,
      poi: action.poi || "",
      force: action.force ?? false,
      source: action.source,
      reason: action.reason,
      priority: typeof action.priority === "string" ? parseInt(action.priority, 10) : action.priority,
      status: action.status,
      failureReason: action.failureReason || null,
      transaction: action.transaction || null,
      protocolNetwork: action.protocolNetwork,
    }));
  }, [data]);

  const handleApprove = async (selectedRows: Action[]) => {
    const actionIDs = selectedRows.map((row) => row.id);
    try {
      await client.request(APPROVE_ACTIONS_MUTATION, {
        actionIDs,
      });
      toast({
        title: "Actions approved",
        description: `Successfully approved ${actionIDs.length} action(s)`,
      });
      mutate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve action(s)",
        variant: "destructive",
      });
      console.error("Failed to approve action(s):", error);
    }
  };

  const handleCancel = async (selectedRows: Action[]) => {
    const actionIDs = selectedRows.map((row) => row.id);
    try {
      await client.request(CANCEL_ACTIONS_MUTATION, {
        actionIDs,
      });
      toast({
        title: "Actions cancelled",
        description: `Successfully cancelled ${actionIDs.length} action(s)`,
      });
      mutate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel action(s)",
        variant: "destructive",
      });
      console.error("Failed to cancel action(s):", error);
    }
  };

  const handleDelete = async (selectedRows: Action[]) => {
    const actionIDs = selectedRows.map((row) => row.id);
    try {
      await client.request(DELETE_ACTIONS_MUTATION, {
        actionIDs,
      });
      toast({
        title: "Actions deleted",
        description: `Successfully deleted ${actionIDs.length} action(s)`,
      });
      mutate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete action(s)",
        variant: "destructive",
      });
      console.error("Failed to delete action(s):", error);
    }
  };

  return (
    <div className="space-y-4">
      <DataGrid
        columns={columns}
        data={actions}
        onRefresh={() => mutate()}
        error={error ? "Failed to load actions" : null}
        isLoading={isLoading}
        initialState={{
          sorting: [{ id: "id", desc: true }],
        }}
        autoRefreshEnabled={autoRefreshEnabled}
        onAutoRefreshChange={setAutoRefreshEnabled}
        autoRefreshInterval={30000} // 30 seconds
        batchActions={[
          {
            label: "Approve",
            onClick: handleApprove,
          },
          {
            label: "Cancel",
            onClick: handleCancel,
          },
          {
            label: "Delete",
            onClick: handleDelete,
          },
        ]}
      />
    </div>
  );
}
