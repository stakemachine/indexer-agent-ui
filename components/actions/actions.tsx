"use client";

import React from "react";
import useSWR from "swr";
import { GraphQLClient, gql } from "graphql-request";
import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/data-grid";
import { useNetworkStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { resolveChainAlias } from "@/lib/utils";

const ACTIONS_LIST_QUERY = gql`
  {
    actions(filter: {}) {
      id
      type
      deploymentID
      allocationID
      amount
      poi
      force
      source
      reason
      priority
      status
      failureReason
      transaction
      protocolNetwork
    }
  }
`;

const APPROVE_ACTIONS_MUTATION = gql`
  mutation approveActions($actionIDs: [Int!]!) {
    approveActions(actionIDs: $actionIDs) {
      id
      type
      allocationID
      deploymentID
      amount
      poi
      force
      source
      reason
      priority
      transaction
      status
    }
  }
`;

const CANCEL_ACTIONS_MUTATION = gql`
  mutation cancelActions($actionIDs: [Int!]!) {
    cancelActions(actionIDs: $actionIDs) {
      id
      type
      allocationID
      deploymentID
      amount
      poi
      force
      source
      reason
      priority
      transaction
      status
    }
  }
`;

const DELETE_ACTIONS_MUTATION = gql`
  mutation deleteActions($actionIDs: [Int!]!) {
    deleteActions(actionIDs: $actionIDs) {
      id
      type
      allocationID
      deploymentID
      amount
      poi
      force
      source
      reason
      priority
      transaction
      status
    }
  }
`;

type Action = {
	id: number;
	type: string;
	deploymentID: string;
	allocationID: string;
	amount: string;
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
		cell: ({ row }) => (
			<div className="w-[180px] truncate">{row.getValue("deploymentID")}</div>
		),
	},
	{
		accessorKey: "allocationID",
		header: "Allocation ID",
		cell: ({ row }) => (
			<div className="w-[180px] truncate">{row.getValue("allocationID")}</div>
		),
	},
	{
		accessorKey: "amount",
		header: "Amount",
		cell: ({ row }) => (
			<div>{parseFloat(row.getValue("amount")).toLocaleString()} GRT</div>
		),
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
						: row.getValue("status") === "canceled"
							? "bg-yellow-500/10 text-yellow-500 border-0"
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
		cell: (row) => resolveChainAlias(row.getValue()),
	},
];

const client = new GraphQLClient("/api/agent");

export function Actions() {
	const { currentNetwork } = useNetworkStore();
	const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(false);

	const fetcher = (query: string) => client.request(query);
	const { data, error, isLoading, mutate } = useSWR(
		ACTIONS_LIST_QUERY,
		fetcher,
	);

	const actions: Action[] = React.useMemo(() => {
		if (!data) return [];
		return data.actions.map((action: Action) => ({
			...action,
			id: parseInt(action.id),
		}));
	}, [data]);

	const handleApprove = async (selectedRows: Action[]) => {
		const actionIDs = selectedRows.map((row) => row.id);
		try {
			const result = await client.request(APPROVE_ACTIONS_MUTATION, {
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
			const result = await client.request(CANCEL_ACTIONS_MUTATION, {
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
			const result = await client.request(DELETE_ACTIONS_MUTATION, {
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
			<div className="flex items-center space-x-2">
				<Switch
					id="auto-refresh-control"
					checked={autoRefreshEnabled}
					onCheckedChange={setAutoRefreshEnabled}
				/>
				<Label htmlFor="auto-refresh-control">Auto-refresh</Label>
			</div>
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
