"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { agentClient } from "@/lib/graphql/client";
import { AGENT_INDEXER_REGISTRATION_QUERY } from "@/lib/graphql/queries";
import { type IndexerRegistration, useIndexerRegistrationStore, useNetworkStore } from "@/lib/store";

export function IndexerRegistrationLoader() {
  const { currentNetwork } = useNetworkStore();
  const { setIndexerRegistration } = useIndexerRegistrationStore();
  const { status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    // Skip on sign-in page or until authenticated
    if (pathname === "/signin" || status !== "authenticated") return;
    const client = agentClient();

    interface RegistrationResponse {
      indexerRegistration?: IndexerRegistration | IndexerRegistration[];
    }
    const fetchIndexerRegistration = async () => {
      try {
        const data: RegistrationResponse = await client.request(AGENT_INDEXER_REGISTRATION_QUERY, {
          protocolNetwork: currentNetwork,
        });
        if (data?.indexerRegistration) {
          // Handle both array and object responses from the agent API
          const registration = Array.isArray(data.indexerRegistration)
            ? data.indexerRegistration[0]
            : data.indexerRegistration;
          if (registration) {
            setIndexerRegistration(registration);
          } else {
            console.error("Indexer registration data is empty");
          }
        } else {
          console.error("Indexer registration data is undefined or null");
        }
      } catch (error) {
        console.error("Failed to fetch indexer registration:", error);
      }
    };

    fetchIndexerRegistration();
  }, [currentNetwork, setIndexerRegistration, pathname, status]);

  return null;
}
