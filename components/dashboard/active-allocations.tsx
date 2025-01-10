"use client";

import React from "react";
import useSWR from "swr";
import { GraphQLClient } from "graphql-request";
import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/data-grid";
import { AGENT_ALLOCATIONS_QUERY } from "@/lib/graphql/queries";
import { useNetworkStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ethers } from "ethers";
import { GeistMono } from "geist/font/mono";

type Allocation = {
	id: string;
	subgraphDeployment: string;
	allocatedTokens: string;
	signalledTokens: string;
	stakedTokens: string;
	createdAt: string;
};

const CustomCheckbox = React.forwardRef<
	HTMLDivElement,
	{ checked: boolean; onCheckedChange: (checked: boolean) => void }
>(({ checked, onCheckedChange }, ref) => (
	<div
		ref={ref}
		tabIndex={0}
		className={cn(
			"h-4 w-4 rounded-sm border border-primary",
			checked && "bg-primary",
		)}
		role="checkbox"
		aria-checked={checked}
		onClick={() => onCheckedChange(!checked)}
		onKeyDown={(e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onCheckedChange(!checked);
			}
		}}
	/>
));

CustomCheckbox.displayName = "CustomCheckbox";

const columns: ColumnDef<Allocation>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<CustomCheckbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
			/>
		),
		cell: ({ row }) => (
			<CustomCheckbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
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
	const { data, error, isLoading, mutate } = useSWR(
		AGENT_ALLOCATIONS_QUERY,
		fetcher,
	);

	const allocations: Allocation[] = React.useMemo(() => {
		if (!data) return [];
		return (data as { indexerAllocations: Allocation[] }).indexerAllocations;
	}, [data]);

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
				initialState={{
					sorting: [{ id: "allocatedTokens", desc: true }],
				}}
			/>
		</div>
	);
}
