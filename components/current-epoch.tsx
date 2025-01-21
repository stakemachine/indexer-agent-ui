"use client";

import React from "react";
import useSWR from "swr";
import { GraphQLClient, gql } from "graphql-request";
import { Progress } from "@/components/ui/progress";
import { useNetworkStore } from "@/lib/store";

const CURRENT_EPOCH_QUERY = gql`
  query CurrentEpochQuery {
    graphNetwork(id: 1) {
      currentL1BlockNumber
    }
    epoches(first: 1, orderDirection: desc, orderBy: startBlock) {
      id
      startBlock
      endBlock
    }
  }
`;

function formatTimeRemaining(blocksRemaining: number): string {
	const secondsRemaining = blocksRemaining * 12;
	const hours = Math.floor(secondsRemaining / 3600);
	const minutes = Math.floor((secondsRemaining % 3600) / 60);
	return `${hours}h ${minutes}m`;
}

export function CurrentEpoch() {
	const { currentNetwork } = useNetworkStore();
	const client = new GraphQLClient(`/api/subgraph/${currentNetwork}`);
	const { data, error } = useSWR(
		CURRENT_EPOCH_QUERY,
		(query) => client.request(query),
		{
			refreshInterval: 60000, // Refresh every minute
		},
	);

	if (error)
		return <div className="text-red-500">Failed to load epoch data</div>;
	if (!data) return <div>Loading epoch data...</div>;

	const epoch = data.epoches[0];
	const currentBlock = parseInt(data.graphNetwork.currentL1BlockNumber);
	const startBlock = parseInt(epoch.startBlock);
	const endBlock = parseInt(epoch.endBlock);

	const progress =
		((currentBlock - startBlock) / (endBlock - startBlock)) * 100;
	const blocksRemaining = endBlock - currentBlock;

	return (
		<div className="bg-primary/10 p-2 rounded-md flex items-center space-x-4">
			<div className="text-sm font-medium">Current Epoch {epoch.id}</div>
			<Progress value={progress} className="w-40" />
			<div className="text-sm text-muted-foreground">
				{formatTimeRemaining(blocksRemaining)} remaining
			</div>
		</div>
	);
}
