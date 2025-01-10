"use client";

import React from "react";
import useSWR from "swr";
import { GraphQLClient, gql } from "graphql-request";
import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/data-grid";
import { useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, fromUnixTime } from "date-fns";
import { ethers } from "ethers";

const ALLOCATIONS_BY_INDEXER_QUERY = gql`
  query allocationByIndexerQuery($indexer: String) {
    allocations(
      first: 1000
      orderBy: createdAt
      orderDirection: desc
      where: { indexer: $indexer }
    ) {
      id
      allocatedTokens
      createdAtEpoch
      closedAtEpoch
      createdAt
      closedAt
      status
      indexingRewards
      indexingIndexerRewards
      indexingDelegatorRewards
      queryFeesCollected
      poi
      subgraphDeployment {
        manifest {
          network
        }
        ipfsHash
        originalName
        stakedTokens
        signalledTokens
        versions{
      subgraph{
        metadata
        {
          displayName
          description
        }
      }
     
    }
      }
    }
  }
`;

type Allocation = {
	id: string;
	allocatedTokens: bigint;
	createdAt: number;
	closedAt: number | null;
	status: string;
	indexingRewards: string;
	queryFeesCollected: string;
	network: string;
	subgraphName: string;
	subgraphDeployment: {
		ipfsHash: string;
		originalName: string;
	};
};

const columns: ColumnDef<Allocation>[] = [
	{
		accessorKey: "id",
		header: "Allocation ID",
		cell: ({ row }) => (
			<div className="w-[180px] truncate">{row.getValue("id")}</div>
		),
	},
	{
		accessorKey: "subgraphDeployment",
		header: "Subgraph",
		cell: ({ row }) => (
			<div className="flex flex-col">
				<span className="font-medium">
					{row.original.subgraphDeployment.originalName
						? row.original.subgraphDeployment.originalName
						: "N/A"}
				</span>
				<span className="text-xs text-muted-foreground">
					{row.original.subgraphDeployment.ipfsHash}
				</span>
			</div>
		),
	},
	{
		accessorKey: "allocatedTokens",
		header: "Allocated Tokens",
		cell: ({ row }) => (
			<div>
				{(+ethers.formatEther(row.getValue("allocatedTokens"))).toFixed(2)} GRT
			</div>
		),
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
		cell: ({ row }) => (
			<div>
				{(+ethers.formatEther(row.getValue("indexingRewards"))).toFixed(2)} GRT
			</div>
		),
	},
	{
		accessorKey: "queryFeesCollected",
		header: "Query Fees",
		cell: ({ row }) => (
			<div>
				{(+ethers.formatEther(row.getValue("queryFeesCollected"))).toFixed(2)}{" "}
				GRT
			</div>
		),
	},
	{
		accessorKey: "network",
		header: "Network",
	},
];

export function Allocations() {
	const { indexerRegistration } = useIndexerRegistrationStore();
	const { currentNetwork } = useNetworkStore();
	const client = new GraphQLClient(`/api/subgraph/${currentNetwork}`);
	const fetcher = (query: string) =>
		client.request(query, {
			indexer: indexerRegistration?.address.toLowerCase(),
		});
	const { data, error, isLoading, isValidating, mutate } = useSWR(
		indexerRegistration?.address ? ALLOCATIONS_BY_INDEXER_QUERY : null,
		fetcher,
	);

	const allocations: Allocation[] = React.useMemo(() => {
		if (!data) return [];
		return data.allocations.map((allocation: any) => ({
			id: allocation.id,
			allocatedTokens: allocation.allocatedTokens,
			createdAt: Number.parseInt(allocation.createdAt),
			closedAt: allocation.closedAt
				? Number.parseInt(allocation.closedAt)
				: null,
			status: allocation.status,
			indexingRewards: allocation.indexingRewards,
			queryFeesCollected: allocation.queryFeesCollected,
			network: allocation.subgraphDeployment.manifest.network,
			subgraphName: allocation.subgraphDeployment.originalName || "Unknown",
			subgraphDeployment: allocation.subgraphDeployment,
		}));
	}, [data]);

	return (
		<DataGrid
			columns={columns}
			data={allocations}
			onRefresh={() => mutate()}
			error={error ? "Failed to load allocations" : null}
			isLoading={isLoading}
			isValidating={isValidating}
			initialState={{
				sorting: [{ id: "createdAt", desc: true }],
			}}
		/>
	);
}
