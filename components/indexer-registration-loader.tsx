"use client";

import { useEffect } from "react";
import {
	useNetworkStore,
	useIndexerRegistrationStore,
	IndexerRegistration,
} from "@/lib/store";
import { AGENT_INDEXER_REGISTRATION_QUERY } from "@/lib/graphql/queries";
import { GraphQLClient } from "graphql-request";

const client = new GraphQLClient("/api/agent");

export function IndexerRegistrationLoader() {
	const { currentNetwork } = useNetworkStore();
	const { setIndexerRegistration } = useIndexerRegistrationStore();

	useEffect(() => {
		console.log("Current network:", currentNetwork);
		const fetchIndexerRegistration = async () => {
			try {
				const data = await client.request(AGENT_INDEXER_REGISTRATION_QUERY, {
					protocolNetwork: currentNetwork,
				});
				if (data && data.indexerRegistration) {
					setIndexerRegistration(
						(data as { indexerRegistration: IndexerRegistration })
							.indexerRegistration,
					);
				} else {
					console.error("Indexer registration data is undefined or null");
				}
			} catch (error) {
				console.error("Failed to fetch indexer registration:", error);
				// Optionally, you can set an error state here if you want to display it in the UI
			}
		};

		fetchIndexerRegistration();
	}, [currentNetwork, setIndexerRegistration]);

	return null; // This component doesn't render anything
}
