"use client";

import { GraphQLClient } from "graphql-request";
import { useEffect } from "react";
import { AGENT_INDEXER_REGISTRATION_QUERY } from "@/lib/graphql/queries";
import { type IndexerRegistration, useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";

export function IndexerRegistrationLoader() {
  const { currentNetwork } = useNetworkStore();
  const { setIndexerRegistration } = useIndexerRegistrationStore();

  useEffect(() => {
    const endpoint = `${window.location.origin}/api/agent`;
    const client = new GraphQLClient(endpoint);

    console.log("Current network:", currentNetwork);
    const fetchIndexerRegistration = async () => {
      try {
        const data = await client.request(AGENT_INDEXER_REGISTRATION_QUERY, {
          protocolNetwork: currentNetwork,
        });
        if (data && data.indexerRegistration) {
          setIndexerRegistration((data as { indexerRegistration: IndexerRegistration }).indexerRegistration);
        } else {
          console.error("Indexer registration data is undefined or null");
        }
      } catch (error) {
        console.error("Failed to fetch indexer registration:", error);
      }
    };

    fetchIndexerRegistration();
  }, [currentNetwork, setIndexerRegistration]);

  return null;
}
