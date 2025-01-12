"use client";

import React from "react";
import useSWR from "swr";
import { GraphQLClient, gql } from "graphql-request";
import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/data-grid";
import { useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { SUBGRAPHS_BY_STATUS_QUERY } from "@/lib/graphql/queries";
import { isValid } from "date-fns";

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
	indexingRewardAmount: string;
	allocatedTokens: string;
};

const columns: ColumnDef<Subgraph>[] = [
	{
		id: "expander",
		header: () => null,
		cell: ({ row }) => (
			<button
				onClick={row.getToggleExpandedHandler()}
				className="cursor-pointer"
			>
				{row.getIsExpanded() ? (
					<ChevronDown className="h-4 w-4" />
				) : (
					<ChevronRight className="h-4 w-4" />
				)}
			</button>
		),
	},
	{
		accessorKey: "displayName",
		header: "Name",
	},
	{
		accessorKey: "network",
		header: "Network",
	},
	{
		accessorKey: "currentSignalledTokens",
		header: "Signalled Tokens",
		cell: ({ row }) => (
			<div>
				{parseFloat(row.getValue("currentSignalledTokens")).toLocaleString()}{" "}
				GRT
			</div>
		),
	},
	{
		accessorKey: "stakedTokens",
		header: "Staked Tokens",
		cell: ({ row }) => (
			<div>{parseFloat(row.getValue("stakedTokens")).toLocaleString()} GRT</div>
		),
	},
	{
		accessorKey: "indexingRewardAmount",
		header: "Indexing Reward",
		cell: ({ row }) => (
			<div>
				{parseFloat(row.getValue("indexingRewardAmount")).toLocaleString()} GRT
			</div>
		),
	},
	{
		accessorKey: "allocatedTokens",
		header: "Allocated Tokens",
		cell: ({ row }) => (
			<div>
				{parseFloat(row.getValue("allocatedTokens") || "0").toLocaleString()}{" "}
				GRT
			</div>
		),
	},
];

export function Subgraphs() {
	const { indexerRegistration } = useIndexerRegistrationStore();
	const { currentNetwork } = useNetworkStore();
	const client = new GraphQLClient(`/api/subgraph/${currentNetwork}`);

	const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(false);

	const fetcher = (query: string) =>
		client.request(query, { indexer: indexerRegistration?.address });
	const { data, error, isLoading, isValidating, mutate } = useSWR(
		indexerRegistration?.address ? SUBGRAPHS_BY_STATUS_QUERY : null,
		fetcher,
	);

	const subgraphs: Subgraph[] = React.useMemo(() => {
		if (!data) return [];
		return data.subgraphs.map((subgraph: any) => ({
			id: subgraph.metadata.id,
			displayName: subgraph.metadata.displayName,
			image: subgraph.metadata.image,
			description: subgraph.metadata.description,
			signalAmount: subgraph.signalAmount,
			signalledTokens: subgraph.signalledTokens,
			active: subgraph.active,
			currentSignalledTokens: subgraph.currentSignalledTokens,
			network: subgraph.currentVersion.subgraphDeployment.manifest.network,
			ipfsHash: subgraph.currentVersion.subgraphDeployment.ipfsHash,
			stakedTokens: subgraph.currentVersion.subgraphDeployment.stakedTokens,
			createdAt: subgraph.currentVersion.subgraphDeployment.createdAt,
			indexingRewardAmount:
				subgraph.currentVersion.subgraphDeployment.indexingRewardAmount,
			allocatedTokens:
				subgraph.currentVersion.subgraphDeployment.indexerAllocations[0]
					?.allocatedTokens || "0",
		}));
	}, [data]);

	const renderSubgraphDetails = React.useCallback((subgraph: Subgraph) => {
		return (
			<Card className="mt-4">
				<CardContent className="p-4">
					<div className="flex items-start space-x-4">
						<div className="flex-shrink-0">
							<Image
								src={subgraph.image || "/placeholder.svg"}
								alt={subgraph.displayName}
								width={64}
								height={64}
								className="rounded-lg"
							/>
						</div>
						<div className="flex-grow">
							<h3 className="text-lg font-semibold">{subgraph.displayName}</h3>
							<p className="text-sm text-muted-foreground mt-1">
								{subgraph.description}
							</p>
							<div className="grid grid-cols-2 gap-4 mt-4">
								<div>
									<p className="text-sm font-medium">IPFS Hash</p>
									<p className="text-sm text-muted-foreground">
										{subgraph.ipfsHash}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium">Created At</p>
									<p className="text-sm text-muted-foreground">
										{new Date(
											parseInt(subgraph.createdAt) * 1000,
										).toLocaleString()}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium">Signal Amount</p>
									<p className="text-sm text-muted-foreground">
										{parseFloat(subgraph.signalAmount).toLocaleString()} GRT
									</p>
								</div>
								<div>
									<p className="text-sm font-medium">Signalled Tokens</p>
									<p className="text-sm text-muted-foreground">
										{parseFloat(subgraph.signalledTokens).toLocaleString()} GRT
									</p>
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
				<Switch
					id="auto-refresh-control"
					checked={autoRefreshEnabled}
					onCheckedChange={setAutoRefreshEnabled}
				/>
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
