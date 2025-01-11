"use client";

import React from "react";
import useSWR from "swr";
import { GraphQLClient } from "graphql-request";
import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/data-grid";
import {
	AGENT_ALLOCATIONS_QUERY,
	CREATE_ACTION_MUTATION,
} from "@/lib/graphql/queries";
import { useNetworkStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ethers } from "ethers";
import { GeistMono } from "geist/font/mono";
import { Checkbox } from "../ui/checkbox";
import { toast } from "@/hooks/use-toast";

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
		cell: ({ row }) => (
			<div className="">{row.getValue("subgraphDeployment")}</div>
		),
	},
	{
		accessorKey: "allocatedTokens",
		header: "Allocated Tokens",
		cell: ({ row }) => (
			<div className={`${GeistMono.className}`}>
				{Number(
					Number(
						ethers.formatEther(row.getValue("allocatedTokens")).toString(),
					).toFixed(0),
				)}
			</div>
		),
	},
	{
		accessorKey: "signalledTokens",
		header: "Signalled Tokens",
		cell: ({ row }) => (
			<div className={`${GeistMono.className}`}>
				{Number(
					Number(
						ethers.formatEther(row.getValue("signalledTokens")).toString(),
					).toFixed(0),
				)}
			</div>
		),
	},
	{
		accessorKey: "stakedTokens",
		header: "Staked Tokens",
		cell: ({ row }) => (
			<div className={` ${GeistMono.className}`}>
				{Number(
					Number(
						ethers.formatEther(row.getValue("stakedTokens")).toString(),
					).toFixed(0),
				)}
			</div>
		),
	},
	{
		accessorKey: "createdAtEpoch",
		header: "Created At Epoch",
		cell: ({ row }) => (
			<div className={`w-[40px] truncate ${GeistMono.className}`}>
				{row.getValue("createdAtEpoch")}
			</div>
		),
	},
];

const client = new GraphQLClient("/api/agent");

export function ActiveAllocations() {
	const { currentNetwork } = useNetworkStore();

	const fetcher = (query: string) => {
		try {
			const result = client.request(query, {
				protocolNetwork: currentNetwork,
			});
			console.log("GraphQL response:", result);
			return result;
		} catch (error) {
			console.error("GraphQL error:", error);
			console.error("Full GraphQL error:", JSON.stringify(error, null, 2));
			throw error;
		}
	};
	const { data, error, isLoading, isValidating, mutate } = useSWR(
		AGENT_ALLOCATIONS_QUERY,
		fetcher,
	);

	const allocations: Allocation[] = React.useMemo(() => {
		if (!data) return [];
		return (data as { indexerAllocations: Allocation[] }).indexerAllocations;
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
			const result = await client.request(CREATE_ACTION_MUTATION, { actions });
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
